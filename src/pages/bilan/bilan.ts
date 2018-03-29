import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController } from 'ionic-angular';
import { MachinesProvider } from '../../providers/machines';
import * as _ from "lodash";

@Component({
  selector: 'page-bilan',
  templateUrl: 'bilan.html',
})
export class BilanPage {
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
      .subscribe(
        (data) => this.seance = data,
        (error) => console.log("getBilanError", error),
        () => {
          loadingGetBilan.dismiss();
          this.timeSeance = this.convertMinsToHrsMins(this.seance.Duree_min);
          this.nbExercices = this.seance.NbExercice;
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

}
