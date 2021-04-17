<template>
  <v-dialog v-model="dialog" max-width="900px" eager>
    <v-card>
      <v-card-title>
        <span class="headline">{{ action }} game</span>
      </v-card-title>
      <v-card-text>
        <v-col cols="12">
          <v-text-field v-model="name" label="Nom"></v-text-field>
        </v-col>
        <v-col cols="12">
          <v-text-field v-model="img_url" label="Img url"></v-text-field>
        </v-col>
        <v-row>
          <v-col cols="4">
            <v-sheet outlined height="150" width="150" @click="openMiniaturePicture">
              <v-icon large>mdi-image-plus</v-icon>
            </v-sheet>
          </v-col>
          <v-col cols="8">
            <v-sheet outlined height="150" width="450" @click="openVignettePicture">
              <v-icon large>mdi-image-plus</v-icon>
            </v-sheet>
          </v-col>
        </v-row>

        <v-row v-if="imageCrop">
          <v-img
            :src.sync="imageCrop"
            class="white--text align-end"
            gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
          >
          </v-img>
        </v-row>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn outlined color="blue darken-1" @click="close"><v-icon class="mr-2">mdi-close</v-icon>Cancel</v-btn>
        <v-btn color="primary" @click="save"><v-icon class="mr-2">mdi-check</v-icon>{{ action }}</v-btn>
      </v-card-actions>
      <ImageCropVue ref="imageCrop"></ImageCropVue>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Ref } from 'vue-property-decorator';
import { GameCrud } from '@/models/Game/gameCrud';
import ImageCropVue from './imageCrop.vue';
import { GamesApi } from '@/api/GamesApi';

@Component({
  name: 'GameVue',
  components: { ImageCropVue }
})
export default class GameVue extends Vue {
  @Ref() readonly imageCrop!: ImageCropVue;

  private dialog = false;
  private resolve: any;
  private reject: any;

  private id = 0;
  private name = '';
  private img_url = '';
  private img: any | null = null;

  get isNew(): boolean {
    return !this.id;
  }
  get action(): string {
    return this.isNew ? 'Create' : 'Update';
  }

  public Open(game?: GameCrud): Promise<GameCrud> {
    this.dialog = true;
    this.reset();
    if (game) this.init(game);

    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  public init(game: GameCrud) {
    this.name = game.title;
    this.img_url = game.image_url;
    this.id = game.id;
  }

  private close() {
    this.dialog = false;
  }

  private async save() {
    try {
      const gameToAdd = new GameCrud();
      gameToAdd.title = this.name;
      gameToAdd.image_url = this.img_url;

      if (this.id) {
        const gameUpdate = await GamesApi.updateGame(gameToAdd, this.id);
        this.dialog = false;
        this.resolve(gameUpdate);
      } else {
        const gameAdded = await GamesApi.addGame(gameToAdd);
        this.dialog = false;
        this.resolve(gameAdded);
      }
    } catch (err) {
      console.log(err);
    }
  }

  private openMiniaturePicture() {
    this.imageCrop.Open();
  }

  private openVignettePicture() {
    this.imageCrop.Open();
  }

  private reset() {
    this.img_url = '';
    this.img = null;
    this.id = 0;
    this.name = '';
  }
}
</script>

<style scoped>
.upload-example-cropper {
  border: solid 1px #eee;
  height: 300px;
  width: 100%;
}

.button-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 17px;
}

.button {
  color: white;
  font-size: 16px;
  padding: 10px 20px;
  background: #3fb37f;
  cursor: pointer;
  transition: background 0.5s;
}

.button:hover {
  background: #38d890;
}

.button input {
  display: none;
}

.cropper {
  height: 600px;
  background: #ddd;
}
</style>
