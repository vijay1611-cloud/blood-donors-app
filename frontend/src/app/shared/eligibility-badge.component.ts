import { Component, computed, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Eligibility } from '../core/models/donor';

@Component({
  selector: 'app-eligibility-badge',
  standalone: true,
  imports: [DatePipe],
  template: `
    <span class="badge" [class.ok]="info().eligible" [class.wait]="!info().eligible">
      @if (info().eligible) {
        Eligible to donate
      } @else {
        Eligible on {{ info().nextEligibleDate | date:'mediumDate' }}
      }
    </span>
  `,
  styles: [`
    .badge { display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 13px; font-weight: 500; }
    .ok { background: #e8f5e9; color: #1b5e20; }
    .wait { background: #fff3e0; color: #e65100; }
  `],
})
export class EligibilityBadgeComponent {
  eligibility = input.required<Eligibility>();
  info = computed(() => this.eligibility());
}
