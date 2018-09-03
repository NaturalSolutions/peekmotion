import { Component, NgZone } from '@angular/core';
import { NavController, NavParams, LoadingController, AlertController, Alert } from 'ionic-angular';
import { NfcProvider } from '../../providers/nfc';
import { RecommendationPage } from '../Recommendation/Recommendation';
import { MachinesProvider } from '../../providers/machines';
import { BLE } from '@ionic-native/ble';
import { trigger, style, transition, animate, keyframes } from '@angular/animations';
import { HomePage } from '../home/home';
@Component({
  selector: 'page-repetition',
  templateUrl: 'repetition.html',
  animations: [

    trigger('zoomAnimation', [
      transition('small <=> large', animate('600ms ease-out', keyframes([
        style({ transform: 'scale(0.5)', offset: 0 }),
        style({ transform: 'scale(1)', offset: 1.0 })
      ]))),
    ]),
  ]
})
export class RepetitionPage {
  blinkInterval;
  private flag: boolean = true;
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
  private bleSubNotification;
  private repetionNumber = 0;
  private firstRepetion;
  private state: string = 'small';
  //belErrSub: any;
  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    private alertCtrl: AlertController,
    private machinesProvider: MachinesProvider,
    private nfcProvider: NfcProvider,
    private zone: NgZone,
    private nfcService: NfcProvider,
    public loadingCtrl: LoadingController,
    private ble: BLE
  ) {

    this.serie = this.navParams.get("serie");
    this.weightSelected = this.navParams.get("weightSelected");
    if (this.weightSelected == "--")
      this.weightSelected = 0;
    this.serieToPost.MasseReelle_kg = this.weightSelected;
    this.repetition = this.serie.Adh_ExerciceConseil.NbRep;
    let chartData = [];
    for (let index = 0; index < this.repetition; index++) {
      chartData.push({
        y: 505370,
        z: 92.9,
        sliced: true,
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
      this.exoID = this.machine.ExoUsage_Liste[0].Mac_L_ExoUsag_Id;
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
          borderWidth: 0,
          slicedOffset: 18,
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
    /*this.belErrSub=this.nfcService.getBleError().first(status => (status == "bleErr")).subscribe(bleStatus => {
      if (bleStatus === "bleErr")
          this.bleError()
  });*/
    this.repetionNumber = 0;
    this.serieNumber = this.serie.NumSerie;
    this.onRepetition(this.firstRepetion);

    this.bleSubNotification = this.ble.startNotification(this.nfcProvider.bleId, 'f000da7a-0451-4000-b000-000000000000', 'f000beef-0451-4000-b000-000000000000')
      .timeout(16000).subscribe((notify) => {
        let data = (Array.prototype.slice.call(new Uint8Array(notify)));
        if (data[2] == 32) {
          this.onRepetition(data);
        }
        if (data[2] == 33) {
          this.bleSubNotification.unsubscribe();
          if (this.repetionNumber < 4)
            this.navCtrl.setRoot(RecommendationPage, { timeRest: false, serie: this.serie, exercice: this.exercice, machine: this.machine })
          else {
            this.postSeance()
          }
        }
      },
        (error) => {
          console.log("error_bleRep", error);
          this.ble.disconnect(this.nfcService.bleId).then(
            () => this.bleError(),
            (err) => console.log("disconnect err", err)
          )
        }
      );
  }

  onRepetition(data): void {
    clearInterval(this.blinkInterval);
    this.state = (this.state === 'small' ? 'large' : 'small');
    this.serieToPost.dPeekRepetition_Liste.push({
      Ordre: this.repetionNumber,
      Periode_ms: (data[6] << 8) & 0x000ff00 | (data[7] << 0) & 0x00000ff,
      Amplitude_cm: ((data[8] << 8) & 0x000ff00 | (data[9] << 0)) / 10,
      Vitesse_mmparsec: (data[10] << 8) & 0x000ff00 | (data[11] << 0) & 0x00000ff,
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

    if ((this.repetionNumber) < this.repetition) {
      this.blinkInterval = setInterval(() => { this.blink(this.repetionNumber) }, 320)
    }
  }

  ionViewWillUnload() {
    clearInterval(this.blinkInterval);
    //this.belErrSub.unsubscribe();
  }

  saveInstance(chartInstance) {
    this.chart = chartInstance;
  }

  blink(rep) {
    if (this.flag)
      this.chart.series[0].data[rep].update({
        color: "#393f46"
      });
    else
      this.chart.series[0].data[rep].update({
        color: "#5b6570"
      });
    this.flag = !this.flag
  }

  private bleError() {
    console.log(" rep ble err");

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
  private postSeance() {
    let loadingPostSerie = this.loadingCtrl.create({
      spinner: 'crescent',
      cssClass: 'loaderCustomCss',
    });
    loadingPostSerie.present();
    this.machinesProvider.postSerie(this.serieToPost, this.nfcProvider.bleName, this.exoID)
      .timeout(40000).subscribe(() => {
        loadingPostSerie.dismiss();
        this.bleSubNotification.unsubscribe();
        this.navCtrl.setRoot(RecommendationPage, { timeRest: true, serie: this.serie, exercice: this.exercice, machine: this.machine })
      },
        (err) => {
          console.log(err);
          loadingPostSerie.dismiss();
          this.bleSubNotification.unsubscribe()
          this.serverError()
        })

  }
  private serverError() {
    let alert: Alert = this.alertCtrl.create({
      title: 'Échec de connexion Internet',
      subTitle: 'Assurez-vous que vous êtes bien connecté à internet',
      enableBackdropDismiss: false,
      cssClass: 'alertCustomCss',
      buttons: [{
        text: 'Réessayer',
        handler: () => {
          this.postSeance()

        }
      },
      {
        text: 'Annuler',
        handler: () => {
          alert.dismiss().then(() =>
            this.navCtrl.setRoot(HomePage))
        }
      }]
    });
    alert.present();
  }
}


