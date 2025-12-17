import { Component, OnInit } from '@angular/core';
import { AuthService } from './auth/auth.service';
import { AlertBoxComponent } from './shared/alert-box/alert-box.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit{
  title = 'expense-tracker';
  constructor(public authService:AuthService,public dialog: MatDialog){}
  ngOnInit(): void {
    const localToken=sessionStorage.getItem('LEAD_ID');
    if(localToken){
      this.authService.authAfterReferesh(true,localToken);
    }
  }
}
