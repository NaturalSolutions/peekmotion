import { Component, ViewChild } from '@angular/core';
import { NavParams, Slides, Loading, LoadingController, NavController } from 'ionic-angular';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { NfcProvider } from '../../providers/nfc';
import { SeancesProvider } from '../../providers/seances';
import { HomePage } from '../home/home';
import { RepetitionPage } from '../repetition/repetition';
import 'rxjs/add/operator/first';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/timer';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/take';
import * as _ from "lodash";
import { BLE } from '@ionic-native/ble';
import { MachinesProvider } from '../../providers/machines';

@Component({
    selector: 'page-recommendation',
    templateUrl: 'recommendation.html',
})
export class RecommendationPage {
    private regLabel = "regLabel";
    rightColor;
    leftColor;
    couleur_Droite;
    couleur_Gauche;
    private exercice;
    private exoID;
    private serieID;
    private addMasse = 0;
    private tagSubscribe;
    @ViewChild(Slides) slides: Slides;
    public countDown;
    private machine;
    private serie;
    private readPooling;
    private firstRepetion;
    private weightColor = { R: 0, G: 0, B: 0 };
    public serieLoaded: boolean = false;
    public weight;
    private weightSelected;
    public masseAppoint;
    public repetition;
    private imgSrc: string = "./assets/imgs/";
    public imgModelFront;
    public imgModelBack;
    private grpMuscu_front = [];
    private grpMuscu_back = [];
    public imgWidh = "82px";
    public imgHeight = "82px";
    private counter;
    private serieNumber;
    public videoUrl: SafeResourceUrl;
    private loadingVideo: Loading;
    public playClicked: boolean = false;
    private recupTime_sec;
    public gridSettings = [];
    private settings = [];
    private settingsUrl = "https://api.connectplus.fr/GCenterWCFOverHttps/getFichier/";
    private timeRest = false;
    private newTime;
    public exerciceName: string;
    public seriesNumberOK: boolean = false;
    public imgGroupMuscu: any = {};

    constructor(
        public navParams: NavParams,
        private domSanitizer: DomSanitizer,
        public loadingCtrl: LoadingController,
        private navCtrl: NavController,
        private machinesProvider: MachinesProvider,
        private seancesProvider: SeancesProvider,
        private nfcService: NfcProvider,
        private ble: BLE
    ) {
        this.exercice = this.navParams.get("exercice");
        this.machine = this.navParams.get("machine");
        this.nfcService.canDisconnect = true;
    }

    ionViewWillEnter() {
        console.log('ionViewDidLoad RecommendationPage');
        console.log("this.bleName", this.nfcService.bleName);
        this.newTime = Math.ceil(new Date().getTime() / 1000);
        this.masseAppoint = this.machine.Masse_Appoint.MasseDetail_Liste;
        _.map(this.masseAppoint, (value) => {
            if (value.Masse_kg == 0)
                value.class = "round-button active"
            else
                value.class = "round-button"
            return value
        });

        if (this.exercice)
            this.exoID = this.exercice.Mac_L_ExoUsag_Id;
        else
            this.exoID = this.machine.ExoUsage_Liste[0].Mac_L_ExoUsag_Id;
        let loadingGetSerie = this.loadingCtrl.create(
            {
                spinner: 'crescent',
                cssClass: 'loaderCustomCss',
            }
        );
        loadingGetSerie.present();
        this.machinesProvider.getSerie(this.nfcService.bleName, this.exoID)
            .subscribe(
                (serie) => {
                    this.serie = serie;
                },
                error => {
                    console.log("error_getSerie", error);
                },
                () => {
                    this.recupTime_sec = this.serie.Adh_ExerciceConseil.Recup_sec;
                    this.counter = this.recupTime_sec;
                    this.timeRest = this.navParams.get("timeRest");
                    if (!this.timeRest) {
                        let lastSeance = this.seancesProvider.getBilanStatus();
                        if (lastSeance.serieID == this.serie.Mac_Exer_Id && lastSeance.stopedTime != 0) {
                            if (lastSeance.lastCounter - (this.newTime - lastSeance.stopedTime) > 0) {
                                this.counter = lastSeance.lastCounter - (this.newTime - lastSeance.stopedTime);
                                this.timeRest = true;
                                this.startTimer();
                            }
                            else
                                this.counter = 0;
                        }
                    }
                    else
                        this.startTimer();
                    loadingGetSerie.dismiss();
                    if (this.serie.Adherent.Sex_Id == 1)
                        this.imgSrc = this.imgSrc + 'men/';
                    if (this.serie.Adherent.Sex_Id == 2)
                        this.imgSrc = this.imgSrc + 'women/';
                    this.imgModelFront = this.imgSrc + 'front.png';
                    this.imgModelBack = this.imgSrc + 'back.png';
                    _.map(this.serie.GrpMuscu_Liste, (value) => {
                        if (value.FrontBack === "Front") {
                            let imgMuscle = this.imgSrc + value.ImageFront;
                            this.grpMuscu_front.push(imgMuscle)
                        }
                        else {
                            let imgMuscle = this.imgSrc + value.ImageBack;
                            this.grpMuscu_back.push(imgMuscle);
                        }
                        return value
                    });
                    let firstGrpMuscu: any = this.serie.GrpMuscu_Liste[0];
                    this.imgGroupMuscu = {
                        isFront: firstGrpMuscu.FrontBack == 'Front',
                        img: this.imgSrc + firstGrpMuscu['Image' + firstGrpMuscu.FrontBack]
                    };
                    this.exerciceName = this.serie.Exer_Libelle;
                    this.serieID = this.serie.Mac_Exer_Id;
                    this.repetition = this.serie.Adh_ExerciceConseil.NbRep;
                    this.weight = this.serie.Adh_ExerciceConseil.IntensitePossible_kg;
                    this.serieNumber = this.serie.NumSerie;
                    if (this.serieNumber > 5)
                        this.seriesNumberOK = true
                    this.videoUrl = this.domSanitizer.bypassSecurityTrustResourceUrl(this.serie.LienVideo);
                    _.map(this.serie.ReglageConseil_Liste, (value) => {
                        if (value.Conseil.length > 3)
                            this.regLabel = "regLabelSmall";
                        else
                            this.regLabel = "regLabelLarge";
                        this.settings.push(["url(" + this.settingsUrl + value.FichierImage + ")", value.Conseil, this.regLabel])
                        return value
                    });
                    this.gridSettings = _.chunk(this.settings, 2);
                    this.changeTitle();
                    if (this.settings.length == 1) {
                        this.imgWidh = "150px";
                        this.imgHeight = "150px";
                    }
                    if (this.settings.length == 2) {
                        this.imgWidh = "120px";
                        this.imgHeight = "120px";
                    }
                    this.serieLoaded = true;
                    this.tagSubscribe = this.nfcService.getTagStatus().first(status => (status == "tag_disconnected")).subscribe(tagStatus => {
                        if (this.serieNumber > 1) {

                            let stopedTime = Math.ceil(new Date().getTime() / 1000);
                            this.seancesProvider.setBilanStatus(true, "continuer", this.serieID, stopedTime, this.counter);
                        }
                        if (tagStatus === "tag_disconnected")
                            this.navCtrl.setRoot(HomePage)
                    })
                }
            );

        this.readWeight();
        this.ble.startNotification(this.nfcService.bleId, 'f000da7a-0451-4000-b000-000000000000', 'f000beef-0451-4000-b000-000000000000')
            .subscribe((data) => {
                this.firstRepetion = (Array.prototype.slice.call(new Uint8Array(data)));
                if (this.firstRepetion[2] == 32) {
                    if (this.serieNumber > 1) {
                        let stopedTime = Math.ceil(new Date().getTime() / 1000);
                        this.seancesProvider.setBilanStatus(true, "continuer", this.serieID, stopedTime, this.counter);
                    }
                    this.navCtrl.setRoot(RepetitionPage, {
                        firstRepetion: this.firstRepetion,
                        weightSelected: this.weightSelected,
                        serie: this.serie,
                        exercice: this.exercice,
                        machine: this.machine
                    })
                }
            },
                (error) => {
                    console.log("error_bleRepRecomandation", error);
                }
            );

    }
    ionViewWillUnload() {
        clearInterval(this.readPooling);
        if (this.tagSubscribe)
            this.tagSubscribe.unsubscribe();
        console.log("ionViewWillUnload RecommendationPage");
    }

    handleIFrameLoadEvent(): void {
        this.loadingVideo.dismiss();
    }

    slideChanged() {
        this.changeTitle();
    };

    changeTitle(): void {
        if (!this.slides.getActiveIndex() && this.timeRest)
            this.exerciceName = "REPOS"
        else
            this.exerciceName = this.serie.Exer_Libelle
    };

    playVideo() {
        this.playClicked = true;
        this.loadingVideo = this.loadingCtrl.create({
            spinner: 'crescent',
            cssClass: 'loaderCustomCss',
        })
        this.loadingVideo.present();
    };

    closeVideo() {
        this.playClicked = false;
    }

    addWeight(event) {
        this.addMasse = event;
        _.map(this.masseAppoint, (value) => {
            if (value.Masse_kg == event)
                value.class = "round-button active"
            else
                value.class = "round-button"
            return value
        });
    };

    startTimer() {
        this.countDown = Observable.timer(0, 1000)
            .takeWhile(() => this.counter >= 1)
            .map(() => --this.counter)
    };

    readWeight() {
        this.readPooling = setInterval(() => {
            this.ble.isConnected(this.nfcService.bleId).then(() => {
                this.ble.read(this.nfcService.bleId, "f000da7a-0451-4000-b000-000000000000", "f000bfff-0451-4000-b000-000000000000")
                    .then((data) => {
                        let color = Array.prototype.slice.call(new Uint8Array(data));
                        let colorSelect = _.chunk(color, 3);
                        let leftColorSensor = Math.trunc(colorSelect[3] / 16);
                        let rightColorSensor = colorSelect[3] % 16;
                        this.leftColor = {
                            R: colorSelect[leftColorSensor][0],
                            G: colorSelect[leftColorSensor][1],
                            B: colorSelect[leftColorSensor][2]
                        }
                        this.rightColor = {
                            R: colorSelect[rightColorSensor][0],
                            G: colorSelect[rightColorSensor][1],
                            B: colorSelect[rightColorSensor][2]
                        }
                        let leftColorMax = Math.max(this.leftColor.R, this.leftColor.G, this.leftColor.B);
                        let leftColorMin = Math.min(this.leftColor.R, this.leftColor.G, this.leftColor.B);
                        let rightColorMax = Math.max(this.rightColor.R, this.rightColor.G, this.rightColor.B);
                        let rightColorMin = Math.min(this.rightColor.R, this.rightColor.G, this.rightColor.B);

                        let whiteThreshold = _.find(this.machine.EtiquettesRefCouleur, { "Mac_EtiqRefCoul_Libelle": "blanc" }).R
                        let balckThreshold = _.find(this.machine.EtiquettesRefCouleur, { "Mac_EtiqRefCoul_Libelle": "noir" }).R

                        if (leftColorMin > whiteThreshold) {
                            this.couleur_Gauche = "blanc";
                        }
                        else if (leftColorMax < balckThreshold) {
                            this.couleur_Gauche = "noir";
                        }
                        else {
                            // Uniformisation
                            let R_unif = this.leftColor.R * 100 / leftColorMax;
                            let G_unif = this.leftColor.G * 100 / leftColorMax;
                            let B_unif = this.leftColor.B * 100 / leftColorMax;
                            // Comparaison
                            let minDist = 1000000000;
                            let etiquette = this.machine.EtiquettesRefCouleur;
                            for (let index = 0; index < etiquette.length; index++) {
                                if (etiquette[index].Mac_EtiqRefCoul_Libelle != "blanc" && etiquette[index].Mac_EtiqRefCoul_Libelle != "noir") {
                                    let dist = (etiquette[index].R - R_unif) * (etiquette[index].R - R_unif) + (etiquette[index].B - B_unif) * (etiquette[index].B - B_unif) + (etiquette[index].G - G_unif) * (etiquette[index].G - G_unif);
                                    if (dist < minDist) {
                                        minDist = dist;
                                        this.couleur_Gauche = etiquette[index].Mac_EtiqRefCoul_Libelle;
                                    }
                                }
                            }
                        }
                        if (rightColorMin > whiteThreshold) {
                            this.couleur_Droite = "blanc";
                        }
                        else if (rightColorMax < balckThreshold) {
                            this.couleur_Droite = "noir";
                        }
                        else {
                            let R_unif = this.rightColor.R * 100 / rightColorMax;
                            let G_unif = this.rightColor.G * 100 / rightColorMax;
                            let B_unif = this.rightColor.B * 100 / rightColorMax;
                            let minDist = 1000000000;
                            let etiquette = this.machine.EtiquettesRefCouleur;
                            for (let index = 0; index < etiquette.length; index++) {
                                if (etiquette[index].Mac_EtiqRefCoul_Libelle != "blanc" && etiquette[index].Mac_EtiqRefCoul_Libelle != "noir") {
                                    let dist = (etiquette[index].R - R_unif) * (etiquette[index].R - R_unif) + (etiquette[index].B - B_unif) * (etiquette[index].B - B_unif) + (etiquette[index].G - G_unif) * (etiquette[index].G - G_unif);
                                    if (dist < minDist) {
                                        minDist = dist;
                                        this.couleur_Droite = etiquette[index].Mac_EtiqRefCoul_Libelle;
                                    }
                                }
                            }
                        }
                        let masseList = this.machine.Masse_Principal.MasseDetail_Liste;
                        let weightSensor = _.find(masseList, { "Couleur_Droite": this.couleur_Droite, "Couleur_Gauche": this.couleur_Gauche })
                        if (weightSensor)
                            this.weightSelected = Number(weightSensor.Masse_kg) + Number(this.addMasse);
                        else
                            this.weightSelected = "--"
                    }, (error) => {
                        console.log('ble read error', error);
                    });
            }, () => console.log(" recomandation ble disconnected")
            )
        }, 1000)
    }
}
