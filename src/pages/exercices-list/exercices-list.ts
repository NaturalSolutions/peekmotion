import { Component } from '@angular/core';
import { NavController, NavParams,AlertController, Alert } from 'ionic-angular';
import { RecommendationPage } from '../Recommendation/Recommendation';
import { HomePage } from '../home/home';
import { NfcProvider } from '../../providers/nfc';
import * as _ from 'lodash';
import { LoginProvider } from '../../providers/loginService';

@Component({
  selector: 'page-exercices-list',
  templateUrl: 'exercices-list.html',
})
export class ExercicesListPage {

  userConnected: boolean = false;
  bleErrDisc : boolean =false;
  private imgSrc: string = "./assets/imgs/";
  private exoList: [any];
  private machine;
  belErrSub;
  currentUser;
  private tagSubscribe;
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private nfcService: NfcProvider,
    private loginProvider: LoginProvider,
    private alertCtrl: AlertController,
  ) {
    this.machine = this.navParams.get("infoMachine");
    this.exoList = this.navParams.get("exoList");
    this.nfcService.startWatch();
  }

  ionViewWillEnter() {
    this.belErrSub = this.nfcService.getBleError().first(status => (status == "bleErr")).subscribe(bleStatus => {
      if (bleStatus === "bleErr") {
          this.belErrSub.unsubscribe();
          this.bleErrDisc=true;
          this.bleError()
      }
  });
    this.tagSubscribe = this.nfcService.getTagStatus().first(status => (status == "tag_disconnected")).subscribe(tagStatus => {
      console.log('getTagStatus', tagStatus);
      if (tagStatus === "tag_disconnected") {
        this.tagSubscribe.unsubscribe();
        this.navCtrl.setRoot(HomePage)
      }
    })
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ExercicesListPage');
    this.loginProvider.getUser()
      .timeout(40000).subscribe((user) => {
        this.currentUser = user;
      },
        error => {
          console.log("getUserError");
          this.serverError()
        },
        () => {
          let sex_Id = this.currentUser.Sex_Id
          if (sex_Id == 1)
            this.imgSrc = this.imgSrc + 'men/';
          if (sex_Id == 2)
            this.imgSrc = this.imgSrc + 'women/'
          this.userConnected = true;
          _.map(this.exoList, (value) => {
            if (value.GrpMuscu_Liste[0].FrontBack === "Front") {
              value.modelImg = this.imgSrc + 'front.png';
              value.muscleImg = this.imgSrc + value.GrpMuscu_Liste[0].ImageFront;
            }
            else {
              value.modelImg = this.imgSrc + 'back.png';
              value.muscleImg = this.imgSrc + value.GrpMuscu_Liste[0].ImageBack;
            }
            return value
          });
        }
      );
    console.log("exoList", this.exoList);
  }

  ionViewWillUnload() {
    this.tagSubscribe.unsubscribe();
    this.nfcService.accUnsubscribe();
  }

  selectExercice(exercice) {
    this.tagSubscribe.unsubscribe();
    this.nfcService.accUnsubscribe();
    if (!this.bleErrDisc)
    this.navCtrl.push(RecommendationPage, { exercice: exercice, machine: this.machine })
  }
  private serverError() {
    let alert = this.alertCtrl.create({
      title: 'Échec de connexion Internet',
      subTitle: 'Assurez-vous que vous êtes bien connecté à internet et reposez le téléphone sur le socle',
      enableBackdropDismiss: false,
      cssClass: 'alertCustomCss',
      buttons: [{
        text: 'OK',
        handler: () => {
          alert.dismiss().then(() =>
            this.navCtrl.setRoot(HomePage))
        }
      }]
    });
    alert.present();
  }

  bleError() {
    console.log(" recomandation ble err");
    this.nfcService.accUnsubscribe();
    let alert: Alert = this.alertCtrl.create({
        title: 'Échec de connexion Bluetooth',
        subTitle: 'Assurez-vous que le sélectionneur de charge est allumé et à portée et reposez le téléphone sur le socle',
        enableBackdropDismiss: false,
        cssClass: 'alertCustomCss',
        buttons: [{
            text: 'OK',
            handler: () => {
                alert.dismiss().then(() =>
                    this.navCtrl.setRoot(HomePage))
            }
        }]
    });
    alert.present();
}
}
