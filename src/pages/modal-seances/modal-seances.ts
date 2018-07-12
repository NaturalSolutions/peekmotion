import { Component } from '@angular/core';
import { NavController, NavParams, ViewController } from 'ionic-angular';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { SeancesProvider } from '../../providers/seances';

@Component({
  selector: 'page-modal-seances',
  templateUrl: 'modal-seances.html',
})
export class ModalSeancesPage {
  seancesList;

  constructor(public navCtrl: NavController,
    public viewCtrl: ViewController,
    public navParams: NavParams,
    private seancesProvider: SeancesProvider,
    private iab: InAppBrowser) {
  }

  ionViewDidLoad() {
    this.seancesList = this.navParams.get('seancesList').dAdhSeance_Liste;
    console.log('ionViewDidLoad ModalSeancesPage', this.seancesList);
  }
  selectSeance(seance) {
    this.seancesProvider.setChangeBtnStatus(true);
    localStorage.setItem('seanceUrl', seance.LienURL_webApp);
    this.seancesProvider.postSeanceID({'id' :seance.Id})
    .subscribe(
        () =>this.viewCtrl.dismiss(seance.LienURL_webApp),
        (err) => console.log('post ID seance err', err)
      )
  }

  getSeanceInfo(event, seance) {
    event.stopPropagation()
    this.iab.create(seance.LienURL_webApp, "_self", { zoom: 'no' });
  }
  unrestrictedSeance() {
    this.seancesProvider.setChangeBtnStatus(true);
    this.viewCtrl.dismiss();
    localStorage.removeItem('seanceUrl');
   
  }

}
