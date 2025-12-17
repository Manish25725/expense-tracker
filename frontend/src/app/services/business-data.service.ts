import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BusinessDataService {
  
  isLogging: boolean = false;
  isChecking:boolean=false;
  hashmap:any={};
  public pieDialogRef:any;
  pieLabels:any=[];
  piedata:any=[];
  chartType:any;
  expensesLogged :any=0;
  latestLoginDate:any='';
  firstLoginDate:any=''
  keywords:any;
  data:any;
  apiUrl = environment.apiUrl;
  userId:any;
  appVersion:any;
  private comingSrc:any='Direct';
  constructor(private route: Router, public http: HttpClient) {
  }

  setComingSrc(val:any){
    this.comingSrc=val;
  }

  getComingSrc(){
    return this.comingSrc;
  }

  getUserIdFromSS(){
    return sessionStorage.getItem('Id')?.split(' ')[1];
  }

  getHttpHeaders() {
    const token = sessionStorage.getItem('LEAD_ID') || localStorage.getItem('LEAD_ID');
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };
  }

  onHome(){
    this.route.navigate(['home']);
  }
  onNavigate(url:any){
    this.route.navigate([url]);
  }

  onGetAllExpense(id:any) {
    this.userId=id;
    return this.http.get(this.apiUrl + 'api/v1/expenses', this.getHttpHeaders());
  }

  onCreateExpense(values: any,date:any) {
    let body={
      name: values.name,
      amount: values.amount,
      expenseDate: new Date(date[0]+' '+date[1]+' '+date[2]+' '+date[3]),
      category: values.expense_category,
      paymentType: values.payment,
      comment: values.comment,
    }
    return this.http.post(this.apiUrl + 'api/v1/expenses', body, this.getHttpHeaders());
  }


  onImportExpense(values:any){
    let date=values.expense_date.split('/');
    date=(new Date(date[2],date[1]-1,date[0]));
    let body={
      name: values.expense_name,
      amount: values.amount,
      expenseDate: date,
      category: values.expense_category,
      paymentType: values.payment_type,
      comment: values.comment,
    }
    return this.http.post(this.apiUrl+'api/v1/expenses/import',{expenses: [body]}, this.getHttpHeaders());
  }


  onCreateCategory(body:any){
    return this.http.patch(this.apiUrl+'api/v1/users/update-categories',{categories: body}, this.getHttpHeaders());
  }

  onEditCategory(body:any){
    return this.http.patch(this.apiUrl+'api/v1/users/update-categories',{categories: body}, this.getHttpHeaders());
  }
  
  onDeleteExpense(id:string){
    return this.http.delete(this.apiUrl+'api/v1/expenses/'+id, this.getHttpHeaders());
  }

  onGetSingleExpense(id:string){
    return this.http.get(this.apiUrl+'api/v1/expenses/'+id, this.getHttpHeaders());
  }

  onUpdateExpense(id:string,values:any){
    let body={
      name: values.name,
      amount: values.amount,
      expenseDate: new Date(values.expense_date),
      category: values.expense_category,
      paymentType: values.payment,
      comment: values.comment,
    }
    return this.http.patch(this.apiUrl+'api/v1/expenses/'+id,body, this.getHttpHeaders());
  }

  onGetAllCategory(){
    return this.http.get(this.apiUrl+'api/v1/users/current-user', this.getHttpHeaders());
  }
  
  onGithub(){
    const link=document.createElement('a');
    link.target="_blank";
    link.href="https://github.com/Manish25725";
    link.click();
  }
  onLinkedin(){
    const link=document.createElement('a');
    link.target="_blank";
    link.href="https://www.linkedin.com/in/manish-kalwani-896529298/";
    link.click();
  }
  
  updateProfile(body:any){
    return this.http.patch(this.apiUrl+'api/v1/users/update-profile', body, this.getHttpHeaders());
  }

  updateWholeInfo(body:any){
    return this.http.patch(this.apiUrl+'api/v1/users/update-profile', body, this.getHttpHeaders());
  }

  getAllSaveData(){
    return this.http.get(this.apiUrl+'api/v1/users/current-user', this.getHttpHeaders());
  }

  getDashboardExpenses(timeFilter: string = 'all') {
    let url = this.apiUrl + 'api/v1/expenses/dashboard';
    if (timeFilter !== 'all') {
      url += `?timeFilter=${timeFilter}`;
    }
    return this.http.get(url, this.getHttpHeaders());
  }

}
