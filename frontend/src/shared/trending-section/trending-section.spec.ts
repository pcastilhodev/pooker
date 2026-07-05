import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { TrendingSection } from './trending-section';
import { FilmeModel } from '../../models/filme-model';

const f = (id: number, total: number, disp: number, preco = 10, dur = 90): FilmeModel => ({
  id, titulo: `F${id}`, genero: 'Ação', ano: new Date('2020-01-01'), preco_aluguel: preco,
  sinopse: '', imagem_url: '', duracao_minutos: dur, classificacao_indicativa: '12',
  data_lancamento: new Date('2020-01-01'), total_copias: total, diretor: 'D', copias_disponiveis: disp,
});

describe('TrendingSection', () => {
  let component: TrendingSection;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({ providers: [{ provide: Router, useValue: routerSpy }] });
    component = TestBed.runInInjectionContext(() => new TrendingSection());
  });

  it('should create', () => { expect(component).toBeTruthy(); });

  it('defaults to the rate tab and computes items when films are set', () => {
    component.films = [f(1, 10, 2), f(2, 10, 8)];
    expect(component.activeTab).toBe('rate');
    expect(component.items.length).toBe(2);
  });

  it('does nothing when films is empty', () => {
    component.films = [];
    expect(component.items).toEqual([]);
  });

  it('setTab switches to price ranking', () => {
    component.films = [f(1, 10, 5, 20), f(2, 10, 5, 5)];
    component.setTab('price');
    expect(component.activeTab).toBe('price');
    expect(component.items[0].id).toBe(1);
  });

  it('setTab switches to duration ranking', () => {
    component.films = [f(1, 10, 5, 10, 60), f(2, 10, 5, 10, 180)];
    component.setTab('duration');
    expect(component.items[0].id).toBe(2);
  });

  it('go navigates to the movie detail page', () => {
    component.go(9);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/movie', 9]);
  });
});
