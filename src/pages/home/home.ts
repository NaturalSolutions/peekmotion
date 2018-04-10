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
import { SeancesProvider } from '../../providers/seances';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  private machine;
  public bilanButton: boolean;
  public homeText: string;
  private seaance;
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
    public loadingCtrl: LoadingController,
    private seancesProvider: SeancesProvider) {
  }


  ionViewWillEnter() {

    this.seaance = this.seancesProvider.getBilanStatus();
    this.bilanButton = this.seaance.bilanStatus;
    this.homeText = this.seaance.homeText;

    if (this.plt.is('android'))
      this.ble.enable()
        .then(
          (status) => { this.activeNFC() },
          (error) => this.openDisabledBle()
        )
    else if (this.plt.is('ios'))
      this.ble.isEnabled()
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
            loadingGetMachineByID.dismiss()
              .then(() => {
                let exoList = this.machine.Modele.ExoUsage_Liste;
                if (exoList.length > 1)
                  this.navCtrl.setRoot(ExercicesListPage, { infoMachine: this.machine, exoList: exoList, Sex_Id: this.currentUser.Sex_Id });
                else
                  this.navCtrl.setRoot(RecommendationPage, { machine: this.machine, Sex_Id: this.currentUser.Sex_Id });
              });
          }
        );
    }, err => {
      console.log("NFCdisabled", err);
    })
  }

  private openDisabledNfc() {
    let alert: Alert = this.alertCtrl.create({
      message: "<img src='./assets/imgs/picto_nfc.png'><br> Merci d'activer le NFC ",
      enableBackdropDismiss: false,
      cssClass: 'alertCustomCss',
      buttons: [{
        text: 'OK',
        handler: () => {
          this.nfc.showSettings()
            .then(result => {
              console.log('showNFCSettings result', result);
              let isEnnabled = setInterval(() => {
                this.nfc.enabled()
                  .then(() => {
                    this.nfcInit();
                    alert.dismiss();
                    clearInterval(isEnnabled)
                  })
              }, 400)
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
      message: "Veuillez activez le bluetooth.",
      enableBackdropDismiss: false,
      cssClass: 'alertCustomCss',
      buttons: [{
        text: 'OK',
        handler: () => {
          setTimeout(() => {
            this.ble.isEnabled()
              .then(() => {
                this.activeNFC();
                alert.dismiss()
              }, error => {
                if (this.plt.is('ios'))
                  this.openDisabledBle();
                else if (this.plt.is('android'))
                  this.ble.showBluetoothSettings()
                    .then(result => {
                      console.log('showNFCSettings result', result);
                      this.openDisabledBle();
                    })
                    .catch(error => {
                      console.log('showNFCSettings error', error);
                      this.openDisabledBle();
                    });
              });
          }, 100);
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
