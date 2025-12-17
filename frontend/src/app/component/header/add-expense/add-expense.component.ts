import { Component, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ActivatedRoute, ParamMap, Params, Router } from '@angular/router';
import { ThemeService } from 'ng2-charts';
import { BusinessDataService } from 'src/app/services/business-data.service';
@Component({
  selector: 'app-add-expense',
  templateUrl: './add-expense.component.html',
  styleUrls: ['./add-expense.component.scss'],
})
export class AddExpenseComponent implements OnInit {
  expenseForm!: FormGroup;
  isEdit: boolean = false;
  isCategoryNotFound:boolean=false;
  filled:boolean=true;
  date: any;
  showLoader:boolean=false;
  id: any;
  maxDate :any=new Date();
  keywords: any = [];
  isSaving:boolean=false;
  payments: any = ['Card', 'Cash', 'UPI', 'Net Banking', 'Paypal'];
  @Input() tags:any=[];
  months: any = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  constructor(
    public businessData: BusinessDataService,
    private _snackBar: MatSnackBar,
    private activateRoute: ActivatedRoute,
    public route: Router
  ) {}
  ngOnInit(): void {
    this.isSaving=false;
    this.businessData.onGetAllCategory().subscribe((res:any)=>{
      // Extract categories from user object
      this.keywords = res.data.categories || [];
    })
    this.expenseForm = new FormGroup({
      name: new FormControl('', [Validators.required,Validators.maxLength(50),Validators.pattern('^[a-zA-Z ]*$')]),
      amount: new FormControl('', Validators.required),
      expense_category: new FormControl('', Validators.required),
      payment: new FormControl('', Validators.required),
      expense_date: new FormControl('', Validators.required),
      comment: new FormControl(''),
    });
    this.activateRoute.paramMap.subscribe((param: ParamMap) => {
      if (param.has('id')) {
        this.isEdit = true;
        this.id = param.get('id');
        this.prePopulate();
      }
      else{
        this.isEdit=false;
      }
    });
  }
  prePopulate() {
    this.showLoader=true;
    this.businessData.onGetSingleExpense(this.id).subscribe((res: any) => {
      let date = res.data.expense_date.toString().split(' ');
      let month = this.months.indexOf(date[1]);
      let day = parseInt(date[2]);
      let year = parseInt(date[3]);
      this.businessData.onGetAllCategory().subscribe((response:any)=>{
        let cate=response.data.categories || [];
        let index=cate.indexOf(res.data.expense_category);
        if(index==-1){
          this.isCategoryNotFound=true;
        }
        this.expenseForm.setValue({
          name: res.data.name,
          amount: res.data.amount,
          expense_date: new Date(year, month, day),
          expense_category: (this.isCategoryNotFound)?'Unassigned':res.data.expense_category,
          payment: res.data.payment,
          comment: res.data.comment,
        });
        this.showLoader=false;
      });
    },error=>{
      this.showLoader=false;
    }
    );
  }

  onReset() {
    this.expenseForm.reset();
    this.expenseForm.markAsUntouched();
  }

  addEvent(event: any) {
    let str = event.value.toString();
    this.date = str.split(' ');
  }

  onSaveExpense() {
    this.isSaving=true;
    this.businessData
      .onCreateExpense(this.expenseForm.value, this.date)
      .subscribe((res: any) => {
        this.isSaving=false;
        if (res.success === true || res.statusCode === 200 || res.statusCode === 201) {
          this._snackBar.open('Expense Added', '', { duration: 2000 });
          this.onReset();
        } else {
          this._snackBar.open('Error occured!! Please try again', '', {
            duration: 2000,
          });
        }
      },(error)=>{
        this.isSaving=false;
        this._snackBar.open('Error occured!! Please try again', '', {
          duration: 2000,
        });
        this.onReset();
      });
  }
  onEdit() {
    this.businessData
      .onUpdateExpense(this.id, this.expenseForm.value)
      .subscribe((res: any) => {
        if (res.success === true || res.statusCode === 200) {
          this._snackBar.open('Expense Updated', '', { duration: 2000 });
        } else {
          this._snackBar.open('Error! Please try Again', '', {
            duration: 2000,
          });
        }
        this.route.navigate(['dashboard']);
      }, (error) => {
        this._snackBar.open('Error! Please try Again', '', {
          duration: 2000,
        });
        this.route.navigate(['dashboard']);
      });
  }
  onCancel() {
    this.route.navigate(['dashboard']);
  }
}
