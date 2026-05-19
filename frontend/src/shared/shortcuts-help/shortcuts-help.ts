import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ShortcutsService, ShortcutDef } from '../../services/shortcuts-service';

interface Group { name: string; items: ShortcutDef[]; }

@Component({
  selector: 'app-shortcuts-help',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './shortcuts-help.html',
  styleUrl: './shortcuts-help.css'
})
export class ShortcutsHelp implements OnInit, OnDestroy {
  visible = false;
  groups: Group[] = [];
  private sub?: Subscription;

  constructor(private shortcuts: ShortcutsService) {}

  ngOnInit() {
    this.groups = this.buildGroups();
    this.sub = this.shortcuts.helpVisible$.subscribe(v => (this.visible = v));
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }

  close() { this.shortcuts.closeHelp(); }

  private buildGroups(): Group[] {
    const order: Group['name'][] = ['Navegação', 'Busca', 'Geral'];
    return order.map(name => ({
      name,
      items: this.shortcuts.defs.filter(d => d.category === name),
    })).filter(g => g.items.length > 0);
  }

  keys(combo: string): string[] {
    return combo.split(' ');
  }
}
