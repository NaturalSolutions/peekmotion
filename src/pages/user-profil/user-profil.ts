import { Component } from '@angular/core';
import { NavController, NavParams, LoadingController } from 'ionic-angular';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController } from 'ionic-angular';
import { LoginProvider } from '../../providers/loginService';
import { HomePage } from '../home/home';
import { NfcProvider } from '../../providers/nfc';

@Component({
  selector: 'page-user-profil',
  templateUrl: 'user-profil.html',
})
export class UserProfilPage {

  profilForm: FormGroup;
  firstConnexion: boolean;
  currentUser;
  objectifs;
  levels;
  pikerOptions = [];
  formloaded: boolean = false;
  weight = [{ options: [] }];
  height = [{ options: [] }];
  profilTitle: string = "Votre Profil";
  profilButton: string = "Modifier vos informations";

  constructor(public navCtrl: NavController,
    public navParams: NavParams,
    private alertCtrl: AlertController,
    private loginProvider: LoginProvider,
    private fb: FormBuilder,
    private nfcProvider: NfcProvider,
    public loadingCtrl: LoadingController) {
    this.nfcProvider.canDisconnect = false;
    this.firstConnexion = this.navParams.get("firstConnexion");
    let loadingGetUser = this.loadingCtrl.create({
      spinner: 'crescent',
      cssClass: 'loaderCustomCss',
    });
    loadingGetUser.present();
    this.loginProvider.getUser()
      .subscribe((user) => {
        this.currentUser = user
      },
        error => {
          this.errorAlert()
        },
        () => {
          loadingGetUser.dismiss();
          this.profilForm = this.fb.group({
            Prenom: [this.currentUser.Prenom, Validators.required],
            Adh_Obj_Id: [this.currentUser.Adh_Obj_Id, Validators.required],
            Taille_cm: [this.currentUser.Taille_cm, Validators.required],
            Poids_kg: [this.currentUser.Poids_kg, Validators.required],
            NivMuscu_Id: [this.currentUser.NivMuscu_Id, Validators.required],
            Sex_Id: [this.currentUser.Sex_Id, Validators.required],
            DateNaissance: [this.currentUser.DateNaissance, Validators.required],
          });
        })
  }

  ionViewDidLoad() {
    if (this.firstConnexion) {
      this.profilTitle = "Completer votre profil";
      this.profilButton = "Valider les informations";
    }
    this.loginProvider.getObjectifs()
      .subscribe((objectifs: any) => {
        this.objectifs = objectifs.dAdhObjectif_Liste;
      },
        error => {
          console.log("getObjectif_error", error);
        },
        () => {
          for (let index = 30; index < 151; index++) {
            let indexString = index.toString()
            this.pikerOptions.push({
              "text": indexString,
              "value": indexString,
            })
          }
          this.weight[0].options = this.pikerOptions;
          this.pikerOptions = [];
          for (let index = 140; index < 221; index++) {
            let indexString = index.toString()
            this.pikerOptions.push({
              "text": indexString,
              "value": indexString,
            })
          }
          this.height[0].options = this.pikerOptions;
          this.loginProvider.getLevel()
            .subscribe((levels: any) => {
              this.formloaded = true;
              this.levels = levels.dAdhTestNiveau_Liste
            })
        })
  }

  submit(profilForm) {
    if (profilForm.valid) {
      console.log(profilForm.value);
      this.loginProvider.updateProfil(profilForm.value).subscribe(() => this.navCtrl.setRoot(HomePage))

    }
    else
      this.errorAlert()
  }

  errorAlert() {
    let alert = this.alertCtrl.create({
      message: "Veuillez compléter le formulaire",
      cssClass: 'alertCustomCss',
      buttons: ['OK']
    });
    alert.present();
  }
}
