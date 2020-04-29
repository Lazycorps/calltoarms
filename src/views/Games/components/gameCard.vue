<template>
    <v-card class="gameCard">
      <v-img
        @click="dialog = true"
        :src="game.img"
        class="white--text align-end"
        gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
        height="200px"
      >
        <v-card-title v-text="game.name"></v-card-title>
      </v-img>
      <v-dialog
        v-model="dialog"
        max-width="290"
        overlay-opacity=0.5
        overlay-color="black"
      >
      <v-card>
        <v-img
          :src="game.img"
          class="white--text align-end"
          gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
          height="120px"
        >
          <v-card-title v-text="game.name"></v-card-title>
        </v-img>
        <v-card-text class="mt-5">
         Need help noob ? Call comrads to arms !
        </v-card-text>
        <v-card-actions>
          <v-btn
            color="primary"
            tile 
            block 
            @click="dialog = false"
          >
          <v-icon class="mr-3">mdi-bugle</v-icon>
            Call to arms
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    </v-card>
</template>

<script lang="ts">
import { Component, Vue, PropSync, Prop } from "vue-property-decorator";
import { Game } from "@/models/Game/game";

@Component({
  name: "GameCard"
})
export default class extends Vue {
  @Prop()
  private game!: Game;
  private dialog: boolean = false;

  private notify(){
    //TODO CALL NOTIFY API
  }
}
</script>

<style scoped>
.gameCard{
  cursor: pointer;
  transition: 0.3s;
}

.gameCard:hover {
  filter: brightness(130%);
}
</style>