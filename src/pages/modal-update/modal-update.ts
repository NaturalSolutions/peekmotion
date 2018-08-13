import { Component } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/timer';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/take';
import { BLE } from '@ionic-native/ble';


@Component({
  selector: 'page-modal-update',
  templateUrl: 'modal-update.html',
})
export class ModalUpdatePage {
  loadProgress = 0;
  dataVersion;
  bleId;
  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    private ble: BLE) {
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ModalUpdatePage');
    this.dataVersion = this.navParams.get('dataVersion');
    this.bleId = this.navParams.get('bleId');
      this.update()
  }

  update() {
    let index = 0;
    let updateObs = Observable.timer(0, 200)
      .takeWhile(() => index < this.dataVersion.length)
      .map(() => {
        let data = new Uint8Array(this.dataVersion[index]);
        this.ble.write(this.bleId, "f000da7a-0451-4000-b000-000000000000", "f000beff-0451-4000-b000-000000000000", data.buffer)
          .then((response) => {
            this.loadProgress = this.loadProgress + 100 / this.dataVersion.length;
            index++;
          },
            (error) => console.log("update version err", error));
        
        return this.dataVersion[index - 1]
      })
    updateObs.subscribe(() => { },
      error => console.log("updateObs", error),
      () => {
          this.viewCtrl.dismiss();
      }
    )
  }
}
