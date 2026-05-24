import { Routes } from '@angular/router';
import { Dashboard } from '../components/dashboard/dashboard';
import { Movie } from '../components/movie/movie';
import { Profile } from '../components/profile/profile';
import { MyRentals } from '../components/my-rentals/my-rentals';
import { Favorites } from '../components/favorites/favorites';
import { Watchlist } from '../components/watchlist/watchlist';
import { Collections } from '../components/collections/collections';
import { Compare } from '../components/compare/compare';

export const routes: Routes = [
  { path: '', component: Dashboard },
  { path: 'movie/:id', component: Movie },
  { path: 'profile', component: Profile },
  { path: 'meus-alugueis', component: MyRentals },
  { path: 'favoritos', component: Favorites },
  { path: 'watchlist', component: Watchlist },
  { path: 'colecoes', component: Collections },
  { path: 'comparar', component: Compare },
  { path: '**', redirectTo: '' }
];
