import { Component, OnInit } from '@angular/core';
import { ItemService } from './item.service';
import { FormsModule } from '@angular/forms';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, InfiniteScrollModule, DragDropModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  leftItems: number[] = [];
  rightItems: any[] = [];
  leftFilter = '';
  rightFilter = '';
  newId = 0;
  leftOffset = 0;
  rightOffset = 0;
  limit = 20;

  loadingLeft = false;
  loadingRight = false;

  private lastLeftScrollTime = 0;
  private lastRightScrollTime = 0;
  private readonly scrollDebounceMs = 200;

  noMoreLeft = false;
  noMoreRight = false;

  private lastLeftRequestOffset = -1;
  private lastRightRequestOffset = -1;
  
  constructor(private itemService: ItemService) {}

  ngOnInit() {
    this.loadLeftItems();
    this.loadRightItems();
  }

  loadLeftItems() {
    if (this.loadingLeft || this.noMoreLeft) {
      return;
    }

    const offset = this.leftItems.length;
    if (offset === this.lastLeftRequestOffset) {
      return;
    }
    this.lastLeftRequestOffset = offset;

    console.debug('[loadLeftItems] offset=', offset, 'limit=', this.limit);

    this.loadingLeft = true;
    this.itemService
      .getItems(this.leftFilter, offset, this.limit)
      .pipe(finalize(() => {
        this.loadingLeft = false;
      }))
      .subscribe({
        next: data => {
          const newItems = data.items.filter((i: number) => !this.leftItems.includes(i));
          this.leftItems = [...this.leftItems, ...newItems];
          this.leftOffset = this.leftItems.length;
          console.debug('[loadLeftItems] loaded', data.items.length, 'new', newItems.length, 'total', data.total);

          if (data.items.length === 0 || data.items.length < this.limit) {
            this.noMoreLeft = true;
          }
        },
        error: err => {
          console.error('[loadLeftItems] error', err);
        }
      });
  }

  loadRightItems() {
    if (this.loadingRight || this.noMoreRight) {
      return;
    }

    const offset = this.rightItems.length;
    if (offset === this.lastRightRequestOffset) {
      return;
    }
    this.lastRightRequestOffset = offset;

    console.debug('[loadRightItems] offset=', offset, 'limit=', this.limit);

    this.loadingRight = true;
    this.itemService
      .getSelected(this.rightFilter, offset, this.limit)
      .pipe(finalize(() => {
        this.loadingRight = false;
      }))
      .subscribe({
        next: data => {
          const newItems = data.items.filter((item: any) => !this.rightItems.some(r => r.id === item.id));
          this.rightItems = [...this.rightItems, ...newItems];
          this.rightOffset = this.rightItems.length;
          console.debug('[loadRightItems] loaded', data.items.length, 'new', newItems.length, 'total', data.total);

          if (data.items.length === 0 || data.items.length < this.limit) {
            this.noMoreRight = true;
          }
        },
        error: err => {
          console.error('[loadRightItems] error', err);
        }
      });
  }

  onLeftScroll() {
    const now = Date.now();
    if (now - this.lastLeftScrollTime < this.scrollDebounceMs) {
      return;
    }
    this.lastLeftScrollTime = now;

    if (this.loadingLeft) {
      return;
    }

    this.loadLeftItems();
  }

  onRightScroll() {
    const now = Date.now();
    if (now - this.lastRightScrollTime < this.scrollDebounceMs) {
      return;
    }
    this.lastRightScrollTime = now;

    if (this.loadingRight) {
      return;
    }

    this.loadRightItems();
  }

  onLeftFilterChange() {
    this.leftItems = [];
    this.leftOffset = 0;
    this.loadingLeft = false;
    this.noMoreLeft = false;
    this.lastLeftRequestOffset = -1;
    this.loadLeftItems();
  }

  onRightFilterChange() {
    this.rightItems = [];
    this.rightOffset = 0;
    this.loadingRight = false;
    this.noMoreRight = false;
    this.lastRightRequestOffset = -1;
    this.loadRightItems();
  }

  addItem() {
    if (this.newId > 0) {
      this.itemService.addItem(this.newId).subscribe(() => {
        this.leftItems = [];
        this.leftOffset = 0;
        this.noMoreLeft = false;
        this.lastLeftRequestOffset = -1;
        this.loadLeftItems();
      });
    }
  }

  selectItem(id: number) {
    this.leftItems = this.leftItems.filter(item => item !== id);
    this.rightItems = [...this.rightItems, { id, order: this.rightItems.length }];

    this.itemService.selectItem(id).subscribe({
      next: () => {
        this.leftItems = [];
        this.leftOffset = 0;
        this.noMoreLeft = false;
        this.lastLeftRequestOffset = -1;

        this.rightItems = [];
        this.rightOffset = 0;
        this.noMoreRight = false;
        this.lastRightRequestOffset = -1;

        this.loadLeftItems();
        this.loadRightItems();
      },
      error: err => {
        console.error('[selectItem] error', err);
      }
    });
  }

  drop(event: CdkDragDrop<any[]>) {
    moveItemInArray(this.rightItems, event.previousIndex, event.currentIndex);
    const newOrder = this.rightItems.map(item => item.id);
    this.itemService.reorderItems(newOrder).subscribe();
  }
}
