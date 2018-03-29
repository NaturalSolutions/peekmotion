import { Component } from '@angular/core';
import { NavController, NavParams } from 'ionic-angular';
import { RecommendationPage } from '../Recommendation/Recommendation';
import { HomePage } from '../home/home';
import { NfcProvider } from '../../providers/nfc';
import * as _ from 'lodash';

@Component({
  selector: 'page-exercices-list',
  templateUrl: 'exercices-list.html',
})
export class ExercicesListPage {

  private imgSrc: string = "./assets/imgs/";
  private exoList: [any];
  private machine;
  private tagSubscribe;
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private nfcService: NfcProvider,

  ) {
    let sex_Id = this.navParams.get("Sex_Id");
    this.machine = this.navParams.get("infoMachine");
    if (sex_Id == 1)
      this.imgSrc = this.imgSrc + 'men/';
    if (sex_Id == 2)
      this.imgSrc = this.imgSrc + 'women/';
    this.exoList = this.navParams.get("exoList");
    console.log('ExercicesListPage constructor');
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
