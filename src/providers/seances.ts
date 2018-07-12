import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Conf } from '../conf';
import 'rxjs/add/operator/map';

@Injectable()
export class SeancesProvider {

  bilanStatus: boolean = false;
  homeText: string = "démarrer";
  serieID: number;
  stopedTime: number=0;
  lastCounter: number;
  changeBtnStatus: boolean = false;

  constructor(public http: HttpClient) {
    console.log('Hello SeancesProvider Provider');
  }


  
  getSeances() {
    return this.http.get<any[]>(Conf.apiBaseUrlV1 + 'adherent/choixSeance');
  }

  getChangeBtnStatus() :boolean {
    return this.changeBtnStatus
  }
  setChangeBtnStatus(status :boolean) {
    this.changeBtnStatus = status
  }

  postSeanceID(seanceID) {
    return this.http.post<any[]>(Conf.apiBaseUrl + 'adherent/choixSeance', seanceID);
  }



  public getBilanStatus() {
    return {
      bilanStatus: this.bilanStatus,
      homeText: this.homeText,
      serieID: this.serieID,
      stopedTime: this.stopedTime,
      lastCounter: this.lastCounter
    }
  }
  public setBilanStatus(status?: boolean, homeText?: string,
    serieID?, stopedTime?: number, lastCounter?: number) {
    this.bilanStatus = status;
    this.homeText = homeText;
    this.serieID = serieID;
    this.stopedTime=stopedTime;
     this.lastCounter=lastCounter;

    console.log("serieID", this.serieID);

  }
}
