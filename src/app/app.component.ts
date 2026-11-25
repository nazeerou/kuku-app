import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { addIcons } from 'ionicons';
import { 
  bagOutline, layersOutline, barChartOutline, statsChartOutline, 
  walletOutline, pieChartOutline, cashOutline, personCircleOutline, 
  logOutOutline, arrowBackOutline, menuOutline 
} from 'ionicons/icons';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `<router-outlet></router-outlet>`
})
export class AppComponent {
  constructor() {
    addIcons({
      bagOutline, layersOutline, barChartOutline, statsChartOutline,
      walletOutline, pieChartOutline, cashOutline, personCircleOutline,
      logOutOutline, arrowBackOutline, menuOutline
    });
  }
}