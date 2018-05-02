import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
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
  private imgSrc: string = "./assets/imgs/";
  private exoList: [any];
  private machine;
  currentUser;
  private tagSubscribe;
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private nfcService: NfcProvider,
    private loginProvider: LoginProvider
  ) {
    this.machine = this.navParams.get("infoMachine");
    this.exoList = this.navParams.get("exoList");
  }

  ionViewWillEnter() {
    this.tagSubscribe = this.nfcService.getTagStatus().first(status => (status == "tag_disconnected")).subscribe(tagStatus => {
      console.log('getTagStatus', tagStatus);
      if (tagStatus === "tag_disconnected")
        this.navCtrl.setRoot(HomePage)
    })
  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad ExercicesListPage');
    this.nfcService.canDisconnect = true;
    this.loginProvider.getUser()
      .subscribe((user) => {
        this.currentUser = user;
      },
        error => {
          console.log("getUserError");
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
    if (this.tagSubscribe) {
      this.tagSubscribe.unsubscribe();
    }
  }

  selectExercice(exercice) {
    this.tagSubscribe.unsubscribe();
    this.navCtrl.push(RecommendationPage, { exercice: exercice, machine: this.machine })
  }

}
