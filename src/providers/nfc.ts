import { Injectable } from '@angular/core';
import { NFC } from '@ionic-native/nfc';
import { LoadingController } from 'ionic-angular';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { BLE } from '@ionic-native/ble';
import { Gyroscope, GyroscopeOrientation, GyroscopeOptions } from '@ionic-native/gyroscope';
import { DeviceMotion, DeviceMotionAccelerationData } from '@ionic-native/device-motion';
import { Platform } from 'ionic-angular';
import 'rxjs/add/operator/retry';
import * as _ from 'lodash';

@Injectable()
export class NfcProvider {

  public bleId: string;
  public bleName: string;
  private tagStatus: BehaviorSubject<any> = new BehaviorSubject('');
  private accSubscribe: Subscription;
  private sub: Subscription
  public canDisconnect: boolean = true;

  constructor(private nfc: NFC,
    private ble: BLE,
    private loadingCtrl: LoadingController,
    private platform: Platform,
    private gyroscope: Gyroscope,
    private deviceMotion: DeviceMotion
  ) {
    console.log('Hello NfcProvider Provider');
  }


  public nfcInit(): Promise<string> {
    console.log('nfcInit');
    return new Promise((resolve, reject) => {
      /* if (this.platform.is("ios")) {
        this.nfc.beginSession().subscribe(() => {
          this.nfc.addNdefListener((data) => {
            console.log("IOS: ", data) // You will not see this, at this point the app will crash
          })
        });
      } */
      console.log("this.bleId init", this.bleId);
      this.ble.isConnected(this.bleId)
        .then(
          () => {
            console.log(' ble isConnected true', this.bleId);
            //setTimeout(() => {
            this.ble.disconnect(this.bleId).then(
              () => {
                console.log('disc ok');
                if (!this.platform.is('ios'))
                  this.nfcListener().then(() => { resolve() });
                else
                  this.nfc.beginSession()
                    .subscribe(() => {
                      this.nfcListener()
                        .then(() => {
                          console.log('connected');
                          resolve()
                        });
                    }, error => {
                      console.log(error);
                    });
              },
              (error) => {
                console.log('disco error', error);
              });
            // }, 500)
          },
          () => {
            if (!this.platform.is('ios'))
              this.nfcListener().then(() => { resolve() });
            else
              this.nfc.beginSession().subscribe(() => {
                this.nfcListener().then(() => {
                  console.log('connected');
                  resolve();
                });
              }, error => {
                console.log(error);
              });
          }
        )
    });
  }

  private startWatch() {
    let options: GyroscopeOptions = {
      frequency: 50
    };
    /*let nb: number = 0;
    this.accSubscribe = this.gyroscope.watch(options)
      .subscribe((orientation: GyroscopeOrientation) => {
        if (!this.canDisconnect)
          return;
        if (Math.abs(orientation.x) > 0.2 || Math.abs(orientation.y) > 0.2 || Math.abs(orientation.z) > 0.2) {
          if (++nb > 50) {
            console.log('vertically moved canDisconnect', this.canDisconnect);
            this.accSubscribe.unsubscribe();
            this.tagStatus.next('tag_disconnected');

            // this.bleService.disconnect().then(() => { console.log("bleService disconnected after acceleration") });
          }
        } else {
          nb = 0;
        }
      });*/

    let accZ;
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
            this.tagStatus.next('tag_disconnected');
          }
        }
        else
          motionCounter = 0;
        lasJerkMean = jerkMean
      }
      curIndex++;
      accZ = acceleration.z;
      console.log("acc", accZ);

    });

  }
  /* private startWatch() {
    let isconnected = setInterval(() => {
      this.nfc.tagIsConnected().then(
        (status) => console.log("tagIsConnected scc: ", status),
        (error) => {
          console.log("tagIsConnected err : ", error);
          if (error == "tag_deconnected") {
            this.tagStatus.next('tag_disconnected');
            clearInterval(isconnected)
          }
        }
      );
    }, 500)

  } */



  getTagStatus(): Observable<any> {
    return this.tagStatus.asObservable();
  }


  private nfcListener(): Promise<string> {
    return new Promise((resolve, reject) => {

      this.sub = this.nfc.addNdefListener((e) => {
        console.log('successfully attached ndef listener', e);
      }, (err) => {
        console.log('error attaching ndef listener', err);
      })
        .subscribe(event => {
          console.log("nfcListener in : ", event);
          let tagBytes = event.tag.ndefMessage[0]["payload"];
          this.bleName = this.nfc.bytesToString(tagBytes.slice(3));
          console.log('tag read success', this.bleName);
          let loadingNfcConnect = this.loadingCtrl.create(
            {
              spinner: 'crescent',
              cssClass: 'loaderCustomCss',
            }
          );
          loadingNfcConnect.present()
            .then(() => {
              // setTimeout(() => {
              this.ble.startScan([])
                .subscribe(device => {
                  if (_.get(device, 'name') == 'Peekmotionv2')
                    console.log('ble peek found', device);
                  if (_.get(device, 'advertising.kCBAdvDataLocalName') == this.bleName || device.id == this.bleName) {
                    console.log('ble found', device);
                    this.ble.stopScan().then(() => {
                      console.log('scan stopped');
                      //  setTimeout(() => {
                      this.bleId = device.id;
                      this.ble.connect(device.id)
                        .retry(10)
                        .subscribe(deviceData => {
                          console.log('ble connected retry', deviceData);
                          if (!deviceData)
                            return;
                          loadingNfcConnect.dismiss().then(() => {
                            this.startWatch();
                            this.tagStatus.next('tag_connected');
                            resolve();
                          });
                        }, error => {
                          console.log('ble connect error', error);
                        });
                      //      }, 500);
                    });
                  }
                }, error => {
                  console.log('startScan error', error);
                });
              // }, 500);
            });
          this.sub.unsubscribe();
        },
          error => {
            console.log('event error', error);
          });
    })
  }
}