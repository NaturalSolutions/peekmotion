import { Component } from '@angular/core';
import { NavController, NavParams, AlertController, Alert, LoadingController } from 'ionic-angular';
import { NfcProvider } from '../../providers/nfc';
import { Platform } from 'ionic-angular';
import { ExercicesListPage } from '../exercices-list/exercices-list';
import { RecommendationPage } from '../Recommendation/Recommendation';
import { UserProfilPage } from '../user-profil/user-profil';
import { BilanPage } from '../bilan/bilan';
import { LoginPage } from '../login/login'
import { MachinesProvider } from '../../providers/machines';
import 'rxjs/add/operator/first';
import { NFC } from '@ionic-native/nfc';
import { BLE } from '@ionic-native/ble';
import { SeancesProvider } from '../../providers/seances';
import { JwtHelperService } from '@auth0/angular-jwt';
import { FabContainer } from 'ionic-angular';
import { NewPasswordPage } from '../new-password/new-password'

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  private machine;
  public bilanButton: boolean;
  public homeText: string;
  private seaance;
  private bleStatus: string;
  loadingGetMachineByID;

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
    private seancesProvider: SeancesProvider
  ) {
    this.nfcService.canDisconnect = false;
    if (this.plt.is('android'))
      this.ble.enable()
        .then(
          (status) => { this.bleReady() },
          (error) => this.openDisabledBle()
        )
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
        this.nfcInit();
      }, (error) => {
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
  };

  private nfcInit() {
    this.nfcService.nfcInit().then((status) => {
      this.loadingGetMachineByID = this.loadingCtrl.create(
        {
          spinner: 'crescent',
          cssClass: 'loaderCustomCss',
        }
      );
      this.loadingGetMachineByID.present();
      this.machinesProvider.getMachineByID(this.nfcService.bleName)
        .subscribe(
          res => this.machine = res,
          (error) => {
            this.serverError();
            console.log("error_getMachine", error);
            this.nfcInit()
          },
          () => {
            this.loadingGetMachineByID.dismiss()
              .then(() => {
                let exoList = this.machine.Modele.ExoUsage_Liste;
                if (exoList.length > 1)
                  this.navCtrl.setRoot(ExercicesListPage, { infoMachine: this.machine, exoList: exoList });
                else
                  this.navCtrl.setRoot(RecommendationPage, { machine: this.machine });
              });
          }
        );
    }, (err) => {
      console.log("NFCdisabled", err);
      this.BleError();
      if (this.plt.is('android'))
        this.nfcInit()
    })
  };

  private serverError() {
    this.loadingGetMachineByID.dismiss()
    let alert: Alert = this.alertCtrl.create({
      title: 'Échec de connexion Internet',
      subTitle: 'Assurez-vous que vous êtes bien connecté à internet et reposez le téléphone sur le socle',
      enableBackdropDismiss: false,
      cssClass: 'alertCustomCss',
      buttons: ['OK']
    });
    alert.present();
  }

  private BleError() {
    let alert: Alert = this.alertCtrl.create({
      title: 'Échec de connexion Bluetooth',
      subTitle: 'Assurez-vous que le sélectionneur de charge est allumé et à portée et reposez le téléphone sur le socle',
      enableBackdropDismiss: false,
      cssClass: 'alertCustomCss',
      buttons: ['OK']
    });
    alert.present();
  }


  public profil(fab: FabContainer) {
    fab.close();
    this.navCtrl.push(UserProfilPage, { firstConnexion: false })
  };

  public logOut(fab: FabContainer) {
    fab.close();
    localStorage.removeItem('peekmotionCurrentUser');
    this.navCtrl.setRoot(LoginPage)
  };
  public bilan() {
    let alert: Alert = this.alertCtrl.create({
      subTitle: 'Êtes-vous sûr de vouloir terminer la seance ?',
      enableBackdropDismiss: false,
      cssClass: 'alertCustomCss',
      buttons: [
        {
          text: 'OUI',
          handler: () => {
            this.navCtrl.push(BilanPage)
            alert.dismiss();
          }
        },
        {
          text: 'NON',
          handler: () => {
            alert.dismiss();
          }
        }
      ]
    });
    alert.present();


  };

  public modifyPassword(fab: FabContainer) {
    fab.close();
    this.navCtrl.push(NewPasswordPage)
  };

}
