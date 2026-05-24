import { Routes } from '@angular/router';
import {Dashboard} from '../components/dashboard/dashboard';
import {Movie} from '../components/movie/movie';
import { Collections } from '../components/collections/collections';

export const routes: Routes = [
  { path: '', component: Dashboard },
  { path: 'movie/:id', component: Movie },
  { path: 'colecoes', component: Collections },
  { path: '**', redirectTo: '' }
];
