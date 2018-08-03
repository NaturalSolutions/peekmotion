import { Component } from '@angular/core';
import { NavController, NavParams, AlertController, Alert, ModalController, LoadingController } from 'ionic-angular';
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
import { FabContainer } from 'ionic-angular';
import { NewPasswordPage } from '../new-password/new-password';
import { ModalSeancesPage } from '../modal-seances/modal-seances';
import { InAppBrowser } from '@ionic-native/in-app-browser';


@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  private seancesList;
  private machine;
  public bilanButton: boolean = false;
  public viewleave: boolean = false;
  public homeText: string;
  private seance;
  currentSeance;
  private bleStatus: string;
  loadingGetMachineByID;
  seanceUrl: string;
  showSeanceBtn: boolean = false;
  changeSeance: boolean = false;
  modalIsActive: boolean = false;

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
    private seancesProvider: SeancesProvider,
    public modalCtrl: ModalController,
    private iab: InAppBrowser
  ) {

  }

  ionViewWillEnter() {
    this.currentSeance = localStorage.getItem('currentSeance');
    this.seance = this.seancesProvider.getBilanStatus();
    this.changeSeance = this.seancesProvider.getChangeBtnStatus();
    if (this.currentSeance && this.currentSeance == "true")
      this.bilanButton = true;
    else
      this.bilanButton = false;
    this.homeText = this.seance.homeText;
  }

  ionViewDidEnter() {
    this.seanceUrl = localStorage.getItem('seanceUrl');
    if (this.seanceUrl)
      this.showSeanceBtn = true;
    
    if (this.plt.is('ios'))
      this.ble.isEnabled()
        .then(
          (status) => { this.bleReady() },
          (error) => this.openDisabledBle()
        )
    this.nfcService.canDisconnect = false;
    if (this.plt.is('android'))
      this.ble.enable()
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
    if ((!this.seanceUrl && !this.bilanButton) && !this.changeSeance) {
      this.modalIsActive = true;
      this.presentSeancesModal()
    }
    this.bleStatus = 'ready';
    if (this.plt.is('android'))
      this.activeNFC();
  }

  private activeNFC() {
    this.nfc.enabled()
      .then((status) => {
        console.log("!this.modalIsActive", !this.modalIsActive);

        if (!this.modalIsActive)
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
        .timeout(40000).subscribe(
          res => this.machine = res,
          (error) => {
            this.loadingGetMachineByID.dismiss()
            this.serverError();
            console.log("error_getMachine", error);
            if (this.plt.is('android'))
              this.nfcInit()
          },
          () => {
            this.loadingGetMachineByID.dismiss()
              .then(() => {
                let exoList = this.machine.ExoUsage_Liste;
                if (exoList.length > 1)
                  this.navCtrl.setRoot(ExercicesListPage, { infoMachine: this.machine, exoList: exoList });
                else
                  this.navCtrl.setRoot(RecommendationPage, { machine: this.machine });
              });
          }
        );
    }, (err) => {
      console.log("NFCdisabled", err);
      if (err == "Bluetooth is disabled.")
        this.openDisabledBle();
      else
        this.bleError();
      if (this.plt.is('android'))
        this.nfcInit()
    })
  };

  private serverError() {
    let alert: Alert = this.alertCtrl.create({
      title: 'Échec de connexion Internet',
      subTitle: 'Assurez-vous que vous êtes bien connecté à internet et reposez le téléphone sur le socle',
      enableBackdropDismiss: false,
      cssClass: 'alertCustomCss',
      buttons: ['OK']
    });
    alert.present();
  }

  private bleError() {
    console.log("home ble err");

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
    this.nfcService.nfcUnsubscribe();
    fab.close();
    this.navCtrl.push(UserProfilPage, { firstConnexion: false })
  };

  public logOut(fab: FabContainer) {
    this.nfcService.nfcUnsubscribe();
    fab.close();
    localStorage.removeItem('peekmotionCurrentUser');
    this.navCtrl.setRoot(LoginPage)
  };
  public bilan() {
    let alert: Alert = this.alertCtrl.create({
      subTitle: 'Êtes-vous sûr de vouloir terminer la séance ?',
      enableBackdropDismiss: false,
      cssClass: 'alertSeancesList ',
      buttons: [
        {
          text: 'OUI',
          handler: () => {
            this.nfcService.nfcUnsubscribe()
            alert.dismiss().then(() =>
              this.navCtrl.push(BilanPage))
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
    this.nfcService.nfcUnsubscribe()
    fab.close();
    this.navCtrl.push(NewPasswordPage)
  };

  getSeanceInfo() {
    this.iab.create(this.seanceUrl, "_blank", { zoom: 'no' });
  }

  presentSeancesModal() {
    this.nfcService.nfcUnsubscribe();
    this.modalIsActive = true;
    this.seancesProvider.getSeances()
      .timeout(40000).subscribe(
        (seances) => {
          this.seancesList = seances;
          console.log("seances", seances)
        },
        (error) => {
          this.serverError();
          console.log("error_getMachine", error);
          if (this.plt.is('android'))
            this.nfcInit()
        },
        () => {
          let seancestModal = this.modalCtrl.create(ModalSeancesPage, { seancesList: this.seancesList }, { cssClass:"seances-modal",enableBackdropDismiss: false });
          seancestModal.onDidDismiss(data => {
            this.changeSeance = this.seancesProvider.getChangeBtnStatus();
            this.modalIsActive = false;
            if (this.plt.is('android'))
              this.nfcInit()
            if (data) {
              this.seanceUrl = data;
              this.showSeanceBtn = true;
            }
            else
              this.showSeanceBtn = false;
          });
          seancestModal.present();
        }
      )
  }

}
