import { Component, NgZone } from '@angular/core';
import { NavController, NavParams, LoadingController } from 'ionic-angular';
import { NfcProvider } from '../../providers/nfc';
import { RecommendationPage } from '../Recommendation/Recommendation';
import { MachinesProvider } from '../../providers/machines';
import { BLE } from '@ionic-native/ble';
import { trigger,state,style,transition,animate,keyframes } from '@angular/animations';

@Component({
  selector: 'page-repetition',
  templateUrl: 'repetition.html',
  animations: [

    trigger('zoomAnimation', [
      transition('small <=> large', animate('600ms ease-out', keyframes([
        style({ transform: 'scale(0.5)',  offset: 0}),
        style({ transform: 'scale(1)',offset: 1.0})
      ]))),
  ]),
   ]
})
export class RepetitionPage {
  private chart;
  public options;
  private serie;
  public serieColor;
  public weightSelected;
  private serieToPost = {
    MasseReelle_kg: 0,
    dPeekRepetition_Liste: []
  };
  public weight;
  private machine;
  private exercice;
  private exoID;
  private repetition;
  public serieNumber;
  private repetionNumber = 0;
  private firstRepetion;
  private state: string = 'small';
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private machinesProvider: MachinesProvider,
    private nfcProvider: NfcProvider,
    private zone: NgZone,
    public loadingCtrl: LoadingController,
    private ble: BLE
  ) {

    this.serie = this.navParams.get("serie");
    this.weightSelected = this.navParams.get("weightSelected");
    this.repetition = this.serie.Adh_ExerciceConseil.NbRep;
    let chartData = [];
    for (let index = 0; index < this.repetition; index++) {
      chartData.push({
        y: 505370,
        z: 92.9,
        color: '#393f46'
      })
    };
    this.weight = this.serie.Adh_ExerciceConseil.IntensitePossible_kg;
    this.firstRepetion = this.navParams.get("firstRepetion");
    this.exercice = this.navParams.get("exercice");
    this.machine = this.navParams.get("machine");
    if (this.exercice)
      this.exoID = this.exercice.Mac_L_ExoUsag_Id;
    else
      this.exoID = this.machine.Modele.ExoUsage_Liste[0].Mac_L_ExoUsag_Id;
    this.options = {
      chart: {
        type: 'variablepie',
        animation: false,
        backgroundColor: 'transparent'
      },
      tooltip: { enabled: false },
      title: false,
      plotOptions: {
        series: {
          allowPointSelect: false,
        },
        variablepie: {
          dataLabels: {
            enabled: false,
          },
          borderWidth: 6,
          borderColor: '#2d2d2d',
          states: {
            hover: {
              halo: {
                size: 0
              }
            }
          }
        }
      },
      series: [{
        innerSize: '78%',
        zMin: 10,
        data: chartData
      }]
    };
  }

  ionViewDidLoad() {

    console.log('ionViewDidLoad RepetitionPage');
    this.repetionNumber = 0;
    this.serieNumber = this.serie.NumSerie;
    this.onRepetition(this.firstRepetion);
    this.nfcProvider.canDisconnect = false;

    this.ble.startNotification(this.nfcProvider.bleId, 'f000da7a-0451-4000-b000-000000000000', 'f000beef-0451-4000-b000-000000000000')
      .subscribe((notify) => {
       
        let data = (Array.prototype.slice.call(new Uint8Array(notify)));
        console.log("data", data);
        if (data[2] == 32) {
          this.onRepetition(data);
        }
        if (data[2] == 33) {
          console.log("this.serieToPost", this.serieToPost);
          if (this.repetionNumber < 4)
            this.navCtrl.setRoot(RecommendationPage, { timeRest: false, serie: this.serie, exercice: this.exercice, machine: this.machine })
          else {
            let loadingPostSerie = this.loadingCtrl.create({
              spinner: 'crescent',
              cssClass: 'loaderCustomCss',
            });
            loadingPostSerie.present();
            this.machinesProvider.postSerie(this.serieToPost, this.nfcProvider.bleId, this.exoID)
              .subscribe(() => {
                loadingPostSerie.dismiss();
                this.navCtrl.setRoot(RecommendationPage, { timeRest: true, serie: this.serie, exercice: this.exercice, machine: this.machine })
              })
          }
        }
      },
        (error) => {
          console.log("error_bleRep", error);
        }
      );

  }

  onRepetition(data): void {
    this.state = (this.state === 'small' ? 'large' : 'small');
    this.serieToPost.dPeekRepetition_Liste.push({
      Ordre: this.repetionNumber,
      Periode_ms: parseInt("" + data[6] + data[7], 16),
      Amplitude_cm: parseInt("" + data[8] + data[9], 16),
      Vitesse_mmparsec: parseInt("" + data[10] + data[11], 16),
      Qualite: data[12]
    });
    console.log(this.repetionNumber);

    if (data[12] == 0) {
      this.serieColor = "#409aca";
      if (this.repetionNumber < this.repetition)
        this.chart.series[0].data[this.repetionNumber].update({
          color: '#409aca'
        });
    }
    if (data[12] == 1) {
      this.serieColor = "#eb771f";
      if (this.repetionNumber < this.repetition)
        this.chart.series[0].data[this.repetionNumber].update({
          color: '#eb771f'
        });
    }
    if (data[12] == 2) {
      this.serieColor = "red";
      if (this.repetionNumber < this.repetition)
        this.chart.series[0].data[this.repetionNumber].update({
          color: 'red'
        });
    }

    this.zone.run(() => {
      this.repetionNumber++;
    
    });

  }

  saveInstance(chartInstance) {
    this.chart = chartInstance;
  }

}
