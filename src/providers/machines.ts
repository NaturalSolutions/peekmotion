import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Conf } from '../conf';
import 'rxjs/add/operator/map';

@Injectable()
export class MachinesProvider {
  constructor(public http: HttpClient) {
  }

  getMachineByID(id) {
    return this.http.get<any[]>(Conf.apiBaseUrlV2 + 'machine/macPhysiqueBtId/' + id);

  }

 
  getSerie(bleName, exerciceID) {
    return this.http.get<any[]>(Conf.apiBaseUrl + 'adherent/serie/macPhysiqueBtId/' + bleName + '/exerciceUsageId/' + exerciceID);
  }

  postSerie(serie, bleName, exerciceID) {
    return this.http.post<any[]>(Conf.apiBaseUrl + 'adherent/serie/macPhysiqueBtId/' + bleName + '/exerciceUsageId/' + exerciceID, serie);
  }

  getBilan() {
    return this.http.get<any[]>(Conf.apiBaseUrl + 'adherent/seance/bilan');
  }

  getNewVersion(exoID) {
    return this.http.get<any[]>(Conf.apiBaseUrlV1 + 'ConfigPostProcessing/'+exoID);
  }
 
}

