import { Player } from '../entities/Player';

export class EvolutionSystem {
  checkEvolution(player: Player): boolean {
    return player.checkEvolution();
  }
}
