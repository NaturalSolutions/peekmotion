import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController, AlertController } from 'ionic-angular';
import { MachinesProvider } from '../../providers/machines';
import * as _ from "lodash";
import { SeancesProvider } from '../../providers/seances';
import { HomePage } from '../home/home';
@Component({
  selector: 'page-bilan',
  templateUrl: 'bilan.html',
})
export class BilanPage {
  exoText: string = "exercice";
  private muscles: any[] = [];
  public timeSeance;
  private seance;
  public nbExercices;
  private confMuscles = {
    "Abdominaux": { color: "#970088" },
    "Adducteur": { color: "#ff4c4c" },
    "Avant-bras": { color: "#ffd500" },
    "Biceps": { color: "#a2ff00" },
    "Epaules": { color: "#00B9ff" },
    "Dos": { color: "#006fff" },
    "Fessier": { color: "#3030ff" },
    "Ischio-jambiers": { color: "#5d00ff" },
    "Lombaires": { color: "#b400ff" },
    "Pectoraux": { color: "#ff8800" },
    "Quadriceps": { color: "#00ffc2" },
    "Mollet": { color: "#004cff" },
    "Trapeze": { color: "#8000ff" },
    "Triceps": { color: "#066d70" },
  }

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private machinesProvider: MachinesProvider,
    private seancesProvider: SeancesProvider,
    private alertCtrl: AlertController,
    public loadingCtrl: LoadingController) {

  }

  ionViewDidLoad() {
    console.log('ionViewDidLoad BilanPage');
    let loadingGetBilan = this.loadingCtrl.create(
      {
        spinner: 'crescent',
        cssClass: 'loaderCustomCss',
      }
    );
    loadingGetBilan.present();
    this.machinesProvider.getBilan()
      .timeout(40000).subscribe(
        (data) => this.seance = data,
        (error) => {
          console.log("getBilanError", error);
          loadingGetBilan.dismiss().then(() =>
          this.serverError())
        },
        () => {
          this.seancesProvider.setBilanStatus(false, "démarrer");
          this.seancesProvider.setChangeBtnStatus(false);
          localStorage.setItem('currentSeance', "false");
          localStorage.removeItem('seanceUrl');
          loadingGetBilan.dismiss();
          this.timeSeance = this.convertMinsToHrsMins(this.seance.Duree_min);
          this.nbExercices = this.seance.NbExercice;
          if (this.nbExercices > 1)
            this.exoText = "exercices";
          console.log("this.seance.GrpMuscu_Liste", this.seance.GrpMuscu_Liste);
          this.muscles = _.map(this.seance.GrpMuscu_Liste, (muscle) => {
            return _.assign(muscle, {
              color: this.confMuscles[muscle.Mac_GrpMuscu_Libelle].color
            });
          });
          console.log("this.muscles", this.muscles);
        }
      )
    this.muscles = _.orderBy(this.muscles, ['Pourcent'], ['desc']);
  }

  convertMinsToHrsMins(minutes) {
    let hh = Math.floor(minutes / 60);
    let mm = minutes % 60;
    let h = hh < 10 ? '0' + hh : hh;
    let m = mm < 10 ? '0' + mm : mm;
    return ('00' + h).slice(-2) + ':' + ('00' + m).slice(-2);

  }

  private serverError() {
    let alert = this.alertCtrl.create({
      title: 'Échec de connexion Internet',
      subTitle: 'Assurez-vous que vous êtes bien connecté à internet',
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
