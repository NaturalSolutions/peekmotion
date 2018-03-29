import { Component } from '@angular/core';
import { NavController, NavParams, AlertController, Alert, LoadingController } from 'ionic-angular';
import { NfcProvider } from '../../providers/nfc';
import { Platform } from 'ionic-angular';
import { ExercicesListPage } from '../exercices-list/exercices-list';
import { RecommendationPage } from '../Recommendation/Recommendation';
import { MachinesProvider } from '../../providers/machines';
import 'rxjs/add/operator/first';
import { UserProfilPage } from '../user-profil/user-profil';
import { LoginProvider } from '../../providers/loginService';
import { BilanPage } from '../bilan/bilan';
import { NFC } from '@ionic-native/nfc';
import { BLE } from '@ionic-native/ble';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  private machine;
  public bilanButton = false;
  private currentUser;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private nfcService: NfcProvider,
    private machinesProvider: MachinesProvider,
    private loginProvider: LoginProvider,
    public plt: Platform,
    private nfc: NFC,
    private ble: BLE,
    private alertCtrl: AlertController,
    public loadingCtrl: LoadingController) {
  }

  ionViewWillEnter() {
    this.bilanButton = this.navParams.get("bilanButton");
    let previousPage = this.navCtrl.last();
    if (previousPage.name == "BilanPage")
      this.bilanButton = false;
    this.ble.enable()
      .then(
        (status) => { this.activeNFC() },
        (error) => this.openDisabledBle()
      )

    this.loginProvider.getUser()
      .subscribe((user) => {
        this.currentUser = user
      },
        error => {
          console.log("getUserError");
        },
    );
  }

  private activeNFC() {

    this.nfc.enabled()
      .then((status) => {
        console.log("nfc active? : ", status);
        this.nfcInit();
      }, (error) => {
        console.log("nfc active? : ", error);
        this.openDisabledNfc();
      })

  }

  private nfcInit() {
    this.nfcService.nfcInit().then(bleId => {
      let loadingGetMachineByID = this.loadingCtrl.create(
        {
          spinner: 'crescent',
          cssClass: 'loaderCustomCss',
        }
      );
      loadingGetMachineByID.present();
      this.machinesProvider.getMachineByID(bleId)
        .subscribe(
          res => this.machine = res,
          (error) => console.log("error_getMachine", error),
          () => {
            loadingGetMachineByID.dismiss();
            let exoList = this.machine.Modele.ExoUsage_Liste;
            if (exoList.length > 1)
              this.navCtrl.setRoot(ExercicesListPage, { infoMachine: this.machine, exoList: exoList, Sex_Id: this.currentUser.Sex_Id });
            else
              this.navCtrl.setRoot(RecommendationPage, { machine: this.machine, Sex_Id: this.currentUser.Sex_Id });
          }
        );
    }, err => {
      console.log("NFCdisabled", err);
    })
  }

  private openDisabledNfc() {
    let alert: Alert = this.alertCtrl.create({
      message: "Veuillez activez le NFC",
      enableBackdropDismiss: false,
      cssClass: 'alertCustomCss',
      buttons: [{
        text: 'OK',
        handler: () => {
              this.nfc.showSettings()
                .then(result => {
                  console.log('showNFCSettings result', result);
                  let isEnnabled =setInterval(() => {
                    this.nfc.enabled()
                    .then(() => {
                      this.nfcInit();
                      alert.dismiss();
                      clearInterval(isEnnabled)
                    })
                  },400)
                })
                .catch(error => {
                  console.log('showNFCSettings error', error);
                });
          
          return false;
        }
      }]
    });
    alert.present();
  }

  private openDisabledBle() {
    let alert: Alert = this.alertCtrl.create({
      message: "Veuillez activez le bluetooth",
      enableBackdropDismiss: false,
      cssClass: 'alertCustomCss',
      buttons: [{
        text: 'OK',
        handler: () => {
          this.ble.enable()
            .then(() => {
              this.activeNFC();
              alert.dismiss()
            })
            .catch(error => {
              this.ble.showBluetoothSettings()
                .then(result => {
                  console.log('showNFCSettings result', result);
                })
                .catch(error => {
                  console.log('showNFCSettings error', error);
                });
            })
          return false;
        }
      }]
    });
    alert.present();
  }

  public profil() {
    this.navCtrl.push(UserProfilPage, { firstConnexion: false })
  }
  public bilan() {
    this.navCtrl.push(BilanPage)
  }
}
