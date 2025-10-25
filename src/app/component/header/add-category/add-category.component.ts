import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { BusinessDataService } from 'src/app/services/business-data.service';
import { MatChipInputEvent } from '@angular/material/chips';
@Component({
  selector: 'app-add-category',
  templateUrl: './add-category.component.html',
  styleUrls: ['./add-category.component.scss']
})
export class AddCategoryComponent implements OnInit{
  @Output() categoryAdded = new EventEmitter<string>();
  keywords:any=[];
  newKeywords:any= [];
  CategoryLoad:boolean=true;
  isSaving:boolean=false;
  isEdit:boolean=false;
  constructor(public businesData:BusinessDataService){}
  ngOnInit(): void {
    this.onGetCategory(); 
  }

  onGetCategory(){
    this.CategoryLoad=true;
    this.isSaving=false;
    this.businesData.onGetAllCategory().subscribe((res:any)=>{
      if(res){
        this.CategoryLoad=false;
        this.keywords=res.data.categories || [];
      }
    });
  }

  removeKeyword(keyword: string) {
    const index = this.newKeywords.indexOf(keyword);
    if (index >= 0) {
      this.newKeywords.splice(index, 1);
    }
  }

  removeKeywordEdit(keyword: string) {
    const index = this.keywords.indexOf(keyword);
    if (index >= 4) {
      this.keywords.splice(index, 1);
    }
  }

  onSaveEditCategories(){
    this.isSaving=true;
    this.businesData.onEditCategory(this.keywords).subscribe((res)=>{
      if(res){
        this.newKeywords=[];
        this.isSaving=false;
        this.isEdit=false;
        this.categoryAdded.emit(this.keywords);
        this.onGetCategory();
      }
    });
  }

  add(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.newKeywords.push(value);
    }
    event.chipInput!.clear();
  }

  onSave() { //api call
    this.isSaving=true;
    this.categoryAdded.emit(this.keywords);
    // Combine existing keywords with new ones
    const updatedCategories = [...this.keywords, ...this.newKeywords];
    this.businesData.onCreateCategory(updatedCategories).subscribe((res)=>{
      if(res){
        this.keywords.push(...this.newKeywords);
        this.newKeywords=[];
        this.isSaving=false;
      }
    });
  }

  onReset() {
    this.newKeywords = [];
  }

  onEditCategories(){
    this.isEdit=!this.isEdit;
  }

}
