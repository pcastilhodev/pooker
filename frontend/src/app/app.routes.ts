import { Routes } from '@angular/router';
import {Dashboard} from '../components/dashboard/dashboard';
import {Movie} from '../components/movie/movie';
import { Collections } from '../components/collections/collections';
import { Compare } from '../components/compare/compare';

export const routes: Routes = [
  { path: '', component: Dashboard },
  { path: 'movie/:id', component: Movie },
  { path: 'colecoes', component: Collections },
  { path: 'comparar', component: Compare },
  { path: '**', redirectTo: '' }
];
