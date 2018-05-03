import { Component } from '@angular/core';
import { NavController, NavParams, AlertController, Alert, LoadingController } from 'ionic-angular';
import { NfcProvider } from '../../providers/nfc';
import { Platform } from 'ionic-angular';
import { ExercicesListPage } from '../exercices-list/exercices-list';
import { RecommendationPage } from '../Recommendation/Recommendation';
import { MachinesProvider } from '../../providers/machines';
import 'rxjs/add/operator/first';
import { UserProfilPage } from '../user-profil/user-profil';
import { BilanPage } from '../bilan/bilan';
import { NFC } from '@ionic-native/nfc';
import { BLE } from '@ionic-native/ble';
import { SeancesProvider } from '../../providers/seances';
import { JwtHelperService } from '@auth0/angular-jwt';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  userConnected: boolean = false;
  private machine;
  public bilanButton: boolean;
  public homeText: string;
  private seaance;
  private bleStatus: string;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private nfcService: NfcProvider,
    private machinesProvider: MachinesProvider,
    public plt: Platform,
    private nfc: NFC,
    private ble: BLE,
    private alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    private seancesProvider: SeancesProvider) {
    this.nfcService.canDisconnect = false;


    const token = JSON.parse(localStorage.getItem("peekmotionCurrentUser"));
    if (token) {
      let jwtHelperService: JwtHelperService = new JwtHelperService({});
      if (!jwtHelperService.isTokenExpired(token)) {
        this.userConnected = true
        if (this.plt.is('android'))
          this.ble.enable()
            .then(
              (status) => { this.bleReady() },
              (error) => this.openDisabledBle()
            )
      }
    }
  }

  ionViewWillEnter() {
    this.seaance = this.seancesProvider.getBilanStatus();
    this.bilanButton = this.seaance.bilanStatus;
    this.homeText = this.seaance.homeText;
  }

  ionViewDidEnter() {
    if (this.plt.is('ios'))
      this.ble.isEnabled()
        .then(
          (status) => { this.bleReady() },
          (error) => this.openDisabledBle()
        )
  }

  private openDisabledBle() {
    let alert: Alert = this.alertCtrl.create({
      message: "Veuillez activer le bluetooth.",
      enableBackdropDismiss: false,
      cssClass: 'alertCustomCss',
      buttons: [{
        text: 'OK',
        handler: () => {
          setTimeout(() => {
            this.ble.isEnabled()
              .then(() => {
                this.bleReady();
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

  private bleReady() {
    this.bleStatus = 'ready';
    if (this.plt.is('android'))
      this.activeNFC();
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

  private nfcInit() {
    this.nfcService.nfcInit().then(() => {
      let loadingGetMachineByID = this.loadingCtrl.create(
        {
          spinner: 'crescent',
          cssClass: 'loaderCustomCss',
        }
      );
      loadingGetMachineByID.present();
      this.machinesProvider.getMachineByID(this.nfcService.bleName)
        .subscribe(
          res => this.machine = res,
          (error) => console.log("error_getMachine", error),
          () => {
            loadingGetMachineByID.dismiss()
              .then(() => {
                let exoList = this.machine.Modele.ExoUsage_Liste;
                if (exoList.length > 1)
                  this.navCtrl.setRoot(ExercicesListPage, { infoMachine: this.machine, exoList: exoList });
                else
                  this.navCtrl.setRoot(RecommendationPage, { machine: this.machine });
              });
          }
        );
    }, err => {
      console.log("NFCdisabled", err);
    })
  }

  public profil() {
    this.navCtrl.push(UserProfilPage, { firstConnexion: false })
  }
  public bilan() {
    this.navCtrl.push(BilanPage)
  }
}
