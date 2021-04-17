<template>
  <v-dialog v-model="dialog" max-width="900px" eager>
    <v-card>
      <v-card-title>
        <span class="headline">Choose picture</span>
      </v-card-title>
      <v-card-text>
        <v-container>
          <v-row>
            <v-col cols="3">
              <div class="button-wrapper">
                <span class="button" @click="$refs.file.click()">
                  <input type="file" ref="file" @change="uploadImage($event)" accept="image/*" />
                  Choose file
                </span>
              </div>
            </v-col>
            <v-col cols="9">
              <v-text-field v-model="img_url" label="Img url"></v-text-field>
            </v-col>
          </v-row>
          <v-row>
            <cropper
              classname="cropper"
              ref="cropper"
              :src.sync="img"
              :stencil-props="{
                handlers: {},
                movable: true,
                scalable: false,
                aspectRatio: 10 / 5
              }"
            ></cropper>
          </v-row>
          <v-row> </v-row>
          <!-- <v-row v-if="imageCrop">
            <v-img
              :src.sync="imageCrop"
              class="white--text align-end"
              gradient="to bottom, rgba(0,0,0,.1), rgba(0,0,0,.5)"
            >
            </v-img>
          </v-row> -->
        </v-container>
      </v-card-text>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn color="primary" @click="save"><v-icon class="mr-2">mdi-check</v-icon>Save</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component, Watch, Ref } from 'vue-property-decorator';
import { Cropper } from 'vue-advanced-cropper';

@Component({
  name: 'ImageCrop',
  components: { Cropper }
})
export default class ImageCrop extends Vue {
  @Ref() readonly cropper!: any;

  private dialog = false;
  private resolve: any;
  private reject: any;

  private img_url = '';
  private img: any | null =
    'https://img.resized.co/dexerto-fr/eyJkYXRhIjoie1widXJsXCI6XCJodHRwczpcXFwvXFxcL2ltYWdlcy5kZXhlcnRvLmZyXFxcL3VwbG9hZHNcXFwvMjAyMFxcXC8wOFxcXC8xMzEwMzIxMFxcXC9pbnRyby0xNTk2NzI2MTY4LmpwZ1wiLFwid2lkdGhcIjpcIlwiLFwiaGVpZ2h0XCI6XCJcIixcImRlZmF1bHRcIjpcImh0dHBzOlxcXC9cXFwvd3d3LmRleGVydG8uY29tXFxcL2Fzc2V0c1xcXC9pbWdcXFwvcGxhY2Vob2xkZXIuanBnXCIsXCJvcHRpb25zXCI6W119IiwiaGFzaCI6IjI4ZDljNmI2ZTI2ZTdjYTNhNmY2MGUyN2UzNWY1OGI3MWZkOWQ1ODEifQ==/intro-1596726168.jpg';
  private coordinates: any = null;
  private imageCrop: any = null;

  public Open(): Promise<any> {
    this.dialog = true;

    return new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  @Watch('img_url')
  private imageUrlChange(value: string) {
    console.log(value);
    this.img = this.img_url;
  }

  private close() {
    this.dialog = false;
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private async save() {}

  private uploadImage(event: any) {
    // Reference to the DOM input element
    const input = event.target;
    // Ensure that you have a file before attempting to read it
    if (input.files && input.files[0]) {
      // create a new FileReader to read this image and convert to base64 format
      const reader = new FileReader();
      // Define a callback function to run, when FileReader finishes its job
      reader.onload = (e) => {
        // Note: arrow function used here, so that "this.imageData" refers to the imageData of Vue component
        // Read image as base64 and set to imageData
        this.img = e?.target?.result;
      };
      // Start the reader job - read file as a data url (base64 format)
      reader.readAsDataURL(input.files[0]);
    }
  }

  private cropImage() {
    const { coordinates, canvas } = this.cropper.getResult();
    this.coordinates = coordinates;
    // You able to do different manipulations at a canvas
    // but there we just get a cropped image
    this.imageCrop = canvas.toDataURL();
    const formData = new FormData();
    formData.append('file', this.imageCrop);
    //GamesApi.setGameImage(this.id, formData);
  }
  private reset() {
    //this.img_url = '';
    this.img = null;
    this.imageCrop = null;
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
