import { Injectable } from '@angular/core';
import { NFC } from '@ionic-native/nfc';
import { LoadingController } from 'ionic-angular';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { BLE } from '@ionic-native/ble';
import { DeviceMotion, DeviceMotionAccelerationData } from '@ionic-native/device-motion';
import { Platform } from 'ionic-angular';
import 'rxjs/add/operator/retry';
import 'rxjs/add/operator/timeout';
import * as _ from 'lodash';

@Injectable()
export class NfcProvider {

  public bleId: string;
  public bleName: string;
  private tagStatus: BehaviorSubject<any> = new BehaviorSubject('');
  private bleStatus: BehaviorSubject<any> = new BehaviorSubject('');
  private accSubscribe: Subscription;
  private sub: Subscription
  public canDisconnect: boolean = true;
  private iosNfcListener: number = 0;
  loadingNfcConnect;


  constructor(private nfc: NFC,
    private ble: BLE,
    private loadingCtrl: LoadingController,
    private platform: Platform,
    private deviceMotion: DeviceMotion
  ) {
    console.log('Hello NfcProvider Provider');
  }

  public nfcInit(): Promise<string> {
    console.log('nfcInit');
    return new Promise((resolve, reject) => {

      console.log("this.bleId init", this.bleId);
      if (this.bleId)
        this.ble.isConnected(this.bleId)
          .then(
            () => {
              console.log(' ble isConnected true', this.bleId);
              setTimeout(() => {
                this.ble.disconnect(this.bleId).then(
                  () => {
                    console.log('disc ok');
                    if (!this.platform.is('ios'))
                      this.nfcListener().then(
                        (success) => resolve(),
                        (error) => reject(error)
                      );
                    else
                      this.nfc.beginSession()
                        .subscribe((success) => {
                          this.iosNfcListener++;
                          if (this.iosNfcListener < 2)
                            this.nfcListener().
                              then(
                                (success) => resolve(),
                                (error) => reject(error)
                              );
                        }, (error) => {
                          console.log("beginSessionERR", error);
                        });
                  },
                  (error) => {
                    console.log('disco error', error);
                  });
              }, 120)
            },
            () => {
              if (!this.platform.is('ios'))
                this.nfcListener().
                  then(
                    (success) => resolve(),
                    (error) => reject(error)
                  );
              else
                this.nfc.beginSession().subscribe((success) => {
                  this.iosNfcListener++;
                  if (this.iosNfcListener < 2)
                    this.nfcListener().then(
                      (success) => resolve(),
                      (error) => reject(error)
                    );
                }, (error) => {
                  console.log("beginSessionERR2", error);
                });
            }
          )
      else {
        if (!this.platform.is('ios'))
          this.nfcListener().
            then(
              (success) => resolve(),
              (error) => reject(error)
            );
        else
          this.nfc.beginSession().subscribe((success) => {
            this.iosNfcListener++;
            if (this.iosNfcListener < 2)
              this.nfcListener().then(
                (success) => resolve(),
                (error) => reject(error)
              );
          }, (error) => {
            console.log("beginSessionERR3", error);
          });
      }
    });
  }

  private startWatch() {
    let options = {
      frequency: 50
    };
    let accZTable = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let curIndex = 0;
    let lasJerkMean = 0;
    let motionCounter = 0;
    this.accSubscribe = this.deviceMotion.watchAcceleration(options).subscribe((acceleration: DeviceMotionAccelerationData) => {
      if (!this.canDisconnect)
        return;
      accZTable[curIndex % 10] = acceleration.z;
      if (curIndex > 10) {
        let jerkMean = (acceleration.z - accZTable[(curIndex + 1) % 10]) / 10;
        if (jerkMean * lasJerkMean <= 0)
          motionCounter = 0;
        else if (Math.abs(jerkMean) > 0.1) {
          motionCounter++
          if (motionCounter > 3) {
            console.log('vertically moved canDisconnect', this.canDisconnect);
            this.accSubscribe.unsubscribe();
            setTimeout(() => {
              this.ble.disconnect(this.bleId).then(
                () => {
                  console.log('disc ok watch');
                  this.tagStatus.next('tag_disconnected');
                },
                (error) => {
                  console.log('disco error', error);
                });
            }, 500)
          }
        }
        else
          motionCounter = 0;
        lasJerkMean = jerkMean
      }
      curIndex++;
    });
  }

  getTagStatus(): Observable<any> {
    return this.tagStatus.asObservable();
  }

  getBleError(): Observable<any> {
    return this.bleStatus.asObservable();
  }

  private nfcListener(): Promise<string> {
    return new Promise((resolve, reject) => {

      this.sub = this.nfc.addNdefListener((e) => {
        console.log('successfully attached ndef listener', e);
      }, (err) => {
        console.log('error attaching ndef listener', err);
      })
        .subscribe(event => {
          this.iosNfcListener = 0;
          console.log("nfcListener in : ", event);
          let tagBytes = event.tag.ndefMessage[0]["payload"];
          this.bleName = this.nfc.bytesToString(tagBytes.slice(3));
          console.log('tag read success', this.bleName);

          this.loadingNfcConnect = this.loadingCtrl.create(
            {
              spinner: 'crescent',
              cssClass: 'loaderCustomCss',
            }
          );
          this.loadingNfcConnect.present()
            .then(() => {
              setTimeout(() => {
                this.ble.isEnabled()
                  .then(() => {
                    setTimeout(() => {
                      let bleScanSub = this.ble.startScan([]).
                        timeout(8000).subscribe(device => {
                          if (_.get(device, 'name') == 'Peekmotionv2')
                            console.log('ble peek found', device);
                          if (_.get(device, 'advertising.kCBAdvDataLocalName') == this.bleName || device.id == this.bleName) {
                            console.log('ble found', device);
                            bleScanSub.unsubscribe();
                            this.ble.stopScan().then(() => {
                              console.log('scan stopped');
                              setTimeout(() => {
                                this.bleId = device.id;
                                let bleConnectSub = this.ble.connect(device.id)
                                  .retry(3).subscribe(
                                    (deviceData) => {
                                      console.log('ble connected retry', deviceData);
                                      this.loadingNfcConnect.dismiss().then(() => {
                                        this.startWatch();
                                        this.tagStatus.next('tag_connected');
                                        this.bleStatus.next('bleOk');
                                        resolve();
                                      });
                                    },
                                    (error) => {
                                      console.log('ble connect error', error);
                                      this.loadingNfcConnect.dismiss().then(() => {
                                        this.bleStatus.next('bleErr');
                                        bleScanSub.unsubscribe();
                                        bleConnectSub.unsubscribe();
                                      })
                                    });
                              }, 20);
                            });
                          }
                        }, error => {
                          this.sub.unsubscribe();
                          this.iosNfcListener = 0;
                          console.log('startScan error', error);
                          this.loadingNfcConnect.dismiss().then(() => {
                            console.log("error dissmiss", error);

                            reject(error)
                          })
                        });
                    }, 20)
                  },
                    error => {
                      this.sub.unsubscribe();
                      this.iosNfcListener = 0;
                      console.log('startScan error2', error);
                      this.loadingNfcConnect.dismiss().then(() => {
                        reject(error)
                      })
                    })
              }, 20);
            });
          this.iosNfcListener = 0;
          this.sub.unsubscribe();
        },
          error => {
            console.log('event error', error);
          });
    })
  }

  nfcUnsubscribe() {
    if (this.sub)
      this.sub.unsubscribe();
  }
}