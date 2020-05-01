<template>
  <v-container fluid>
    <v-data-table
        :headers="headers"
        :items="games"
        class="elevation-1"
      >
        <template v-slot:top>
          <v-toolbar flat>
            <v-toolbar-title>
              Games
              </v-toolbar-title>
            <v-divider
              class="mx-4"
              inset
              vertical
            ></v-divider>
            <v-btn icon color="primary" @click="RefreshGames"><v-icon>mdi-refresh</v-icon></v-btn>
            <v-spacer></v-spacer>
            <v-dialog v-model="dialog" max-width="500px">
              <template v-slot:activator="{ on }">
                <v-btn color="primary" dark class="mb-2" v-on="on" @click="addItem">Add games</v-btn>
              </template>
              <v-card>
                <v-card-title>
                  <span class="headline">{{ action }} game</span>
                </v-card-title>
                <v-card-text>
                  <v-container>
                    <v-row>
                      <v-col cols="12">
                        <v-text-field v-model="name" label="Nom"></v-text-field>
                      </v-col>
                      <v-col cols="12">
                        <v-text-field v-model="img_url" label="Img url"></v-text-field>
                      </v-col>
                    </v-row>
                  </v-container>
                </v-card-text>
                <v-card-actions>
                  <v-spacer></v-spacer>
                  <v-btn outlined color="blue darken-1" @click="close"><v-icon class="mr-2">mdi-close</v-icon>Cancel</v-btn>
                  <v-btn color="primary" @click="save"><v-icon class="mr-2">mdi-check</v-icon>{{action}}</v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-toolbar>
        </template>
        <template v-slot:item.actions="{ item }">
          <v-icon small class="mr-2" @click="editItem(item)">
            mdi-pencil
          </v-icon>
          <v-icon
            small
            @click="deleteItem(item)"
          >
            mdi-delete
          </v-icon>
        </template>
      </v-data-table>
      <v-snackbar v-model="snackbar" :timeout="snackbarTimeout" :color="snackbarColor">
      <v-icon dark class="mr-3">{{ snackbarColor == "error" ? "mdi-delete" : "mdi-check" }}</v-icon>
      <span v-html="snackbarMessage"></span>
      <v-btn icon dark @click="snackbar = false"><v-icon>mdi-close</v-icon></v-btn>
    </v-snackbar>
  </v-container>
</template>

<script lang="ts">
import { Component, Vue } from "vue-property-decorator";
import { UserModule } from "@/store/modules/user";
import { GameCrud } from "@/models/Game/gameCrud";
import { GamesApi } from "@/api/GamesApi";

@Component({
  name: "GamesCrud"
})
export default class extends Vue {
  private games: GameCrud[] = []
    private dialog: boolean = false;
    private headers = [
    { text:"Id", value: "id"},
    { text: "Title", value: "title" },
    { text: "Img", value: "image_url" },
    { text: "Created", value: "created_at" },
    { text: "Updated", value: "updated_at" },
    { text: 'Actions', value: 'actions', sortable: false },
  ];
 
  private action: string = "";
  private editedItem: GameCrud = new GameCrud();
  private id: number = 0;
  private name: string = "";
  private img_url: string = "";

  mouted(){
    this.RefreshGames();
  }

  private async RefreshGames(){
    this.games = await GamesApi.fetchGames();
  }

  private addItem(){
    this.action = "Add";
    this.dialog = true;
  }

  private editItem(editedItem: GameCrud){
    this.action = "Update";
    this.editedItem = editedItem;
    this.name = editedItem.title;
    this.img_url = editedItem.image_url;
    this.dialog = true;
  }

  private async deleteItem(editedItem: GameCrud){
    try {
      await GamesApi.deleteGame(editedItem.id);
      this.games.splice(this.games.indexOf(editedItem), 1);
      this.notify(`${editedItem.title} remove success`, "orange")
    } catch (error) {
      
    }
  }

  private close(){
    this.dialog = false;
    this.editedItem = new GameCrud();
  }

  private async save(){
    try{
      let gameToAdd = new GameCrud();
      gameToAdd.title = this.name;
      gameToAdd.image_url = this.img_url;

      if(this.editedItem.id){
        let gameUpdate = await GamesApi.updateGame(gameToAdd, this.editedItem.id);
        Vue.set(this.games, this.games.findIndex(e => e == this.editedItem), gameUpdate);
        this.notify(`${gameToAdd.title} update success`, "green")
      }
      else{
        let gameAdded = await GamesApi.addGame(gameToAdd);
        this.games.push(gameAdded);
        this.notify(`${gameToAdd.title} add success`, "green")
      }
      this.dialog = false;
    }catch(err){
      console.log(err);
    }
  }

  private snackbar: boolean = false;
  private snackbarTimeout: number = 5000;
  private snackbarMessage: string = "";
  private snackbarColor: string = "";

  private notify(message: string, color:string){
    this.snackbarColor = color;
    this.snackbarMessage = message;
    this.snackbar = true;
  }
}
</script>
