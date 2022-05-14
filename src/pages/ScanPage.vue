<template>
  <ion-page>
    <div class="container">
      <div class="barcode-scanner--area--container">
        <div class="relative">
          <p>Aim your camera at a barcode {{resval}}</p>
        </div>
        <div class="square surround-cover">
          <div class="barcode-scanner--area--outer surround-cover">
            <div class="barcode-scanner--area--inner"></div>
          </div>
        </div>
      </div>
    </div>
  </ion-page>
</template>

<script>
import { computed, defineComponent, onMounted } from 'vue';
import { IonPage,alertController,loadingController} from '@ionic/vue';
import {ref} from 'vue';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import {useRouter,onBeforeRouteLeave,} from 'vue-router'
import { useStore } from 'vuex';
import {qrParser,} from '@/shared/helper.js'
import axios from 'axios';



export default  defineComponent({
  name: 'ScanPage',
  components: { IonPage},
  setup(){
    const router = useRouter();

    const res = ref("blank");

    const resval = ref("blank");


    const showOrNot = ref(false);

    

    const store = useStore()

    onMounted(async () => {await startScan()})

    onBeforeRouteLeave(async () => { await stopScanBack()})

    const inOrOut = computed(()=> store.getters['apis/getInOrOut'])


//     {
//     "timestamp": "2022-02-27T10:15:17.843056Z",
//     "expDate": null,
//     "qrcode": "abcd4567",
//     "batchDetails": "fasdfasdf",
//     "unitChange": null,
//     "brandID": 1,
//     "destKitchen": 1,
//     "recipeID": 3,
//     "itemID": null,
//     "partnerID" : 1
// }

    

    const startScan = async () => {
      await store.dispatch("auth/getUserData")
      showOrNot.value = true;
      res.value = ""
      BarcodeScanner.hideBackground(); // make background of WebView transparent
      document.body.style.background = "transparent";

      const result = await BarcodeScanner.startScan(); // start scanning and wait for a result

      // if the result has content
      if (result.hasContent) {
        res.value = result.content;
        await store.dispatch("apis/setQrCode",res.value);
        if(res.value != ""){
            const userData = computed(() => store.getters['auth/getUserData'])
            const retVal = qrParser(res.value,inOrOut.value,userData.value.id,userData.value.partnerWorkingForKitchen.id)
            resval.value = retVal
            if(inOrOut.value == 'in'){
                //call in axios call function
                const access_token = computed(() => store.getters['auth/getAuthData'].token).value
                // console.log(access_token)

                axios.interceptors.request.use(function (config) {
                    config.headers.Authorization =  "JWT " + access_token;
                    return config;
                });

                console.log("waddup: ",JSON.stringify(retVal))
                const response = await axios.post("https://fifo-update.cokit.tech/fifo/inputScan", retVal);
                const loading = await presentLoading();
                resval.value = response.status
                console.log("response text: ",response.data)
                if(response.data == 'Already EXISTS'){
                  loading.dismiss()
                  await existsAlert()
                }else if(response.status == 200 || response.status == 201){
                  loading.dismiss()
                  await successAlert()
                }
            }else if (inOrOut.value == 'out'){
                //call out axios call function
                const access_token = computed(() => store.getters['auth/getAuthData'].token).value
                // console.log(access_token)

                axios.interceptors.request.use(function (config) {
                    config.headers.Authorization =  "JWT " + access_token;
                    return config;
                });

                console.log("waddup: ",JSON.stringify(retVal))
                const response = await axios.post("https://fifo-update.cokit.tech/fifo/outputScan", retVal);
                resval.value = response.status
                console.log(resval.value)
            }
        }
      }
      if (resval.value == 200 || resval.value == 201){
        await stopScan();
      }
    };

    const existsAlert = async () => {
      const alert = await alertController
        .create({
          cssClass: 'exists-alert',
          header: 'Alert',
          subHeader: 'Already Exists',
          message: 'The packet was already scanned',
          buttons: ['OK'],
        });
      await alert.present();

      const { role } = await alert.onDidDismiss();
      console.log('onDidDismiss resolved with role', role);
    }

    const successAlert = async () => {
      const alert = await alertController
        .create({
          cssClass: 'success-alert',
          header: 'Alert',
          subHeader: 'Success',
          message: 'Successfully Scanned',
          buttons: ['OK'],
        });
      await alert.present();

      const { role } = await alert.onDidDismiss();
      console.log('onDidDismiss resolved with role', role);
    }

    const presentLoading = async () => {
      const loading = await loadingController
        .create({
          cssClass: 'loading-spinner',
          message: 'Please wait...',
        });
        
      await loading.present();
      return loading
    }

    const checkPermission = async () => {
      const status = await BarcodeScanner.checkPermission({ force: true });

      if (status.granted) {
        // the user granted permission
        return true;
      }

      return false;
    };
    const stopScan = async () => {
      showOrNot.value = false
      await BarcodeScanner.showBackground();
      await BarcodeScanner.stopScan();
      router.replace({path:'/tabs/tab2'})
    };
    const stopScanBack = async () => {
      showOrNot.value = false
      BarcodeScanner.showBackground();
      await BarcodeScanner.stopScan();
    };
    return {
      startScan,
      stopScan,
      checkPermission,
      existsAlert,
      successAlert,
      res,
      showOrNot,
      resval
    }
  }
});
</script>

<style scoped>
      * {
        box-sizing: border-box;
      }
      p {
        color: #fff;
        font-family: sans-serif;
        text-align: center;
        font-weight: 600;
      }
      html,
      body,
      .container {
        width: 100%;
        height: 100%;
        overflow: hidden;
      }
      .container {
        display: flex;
      }
      .relative {
        position: relative;
        z-index: 1;
      }
      .square {
        width: 100%;
        position: relative;
        overflow: hidden;
        transition: 0.3s;
      }
      .square:after {
        content: '';
        top: 0;
        display: block;
        padding-bottom: 100%;
      }
      .square > div {
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
      }
      .surround-cover {
        box-shadow: 0 0 0 99999px rgba(0, 0, 0, 0.5);
      }
      .barcode-scanner--area--container {
        width: 80%;
        max-width: min(500px, 80vh);
        margin: auto;
      }
      .barcode-scanner--area--outer {
        display: flex;
        border-radius: 1em;
      }
      .barcode-scanner--area--inner {
        width: 100%;
        margin: 1rem;
        border: 2px solid #fff;
        box-shadow: 0px 0px 2px 1px rgb(0 0 0 / 0.5),
          inset 0px 0px 2px 1px rgb(0 0 0 / 0.5);
        border-radius: 1rem;
      }

      
      @keyframes shake {
        0% {
          transform: translate(0, 0) rotate(0deg) scale(1);
        }
        20% {
          transform: translate(5px, 5px) rotate(-1deg) scale(1.05);
        }
        40% {
          transform: translate(5px, 5px) rotate(-2deg) scale(1.07);
        }
        60% {
          transform: translate(2px, 2px) rotate(0deg) scale(1.04);
        }
        80% {
          transform: translate(-1px, -1px) rotate(-2deg) scale(1.05);
        }
        100% {
          transform: translate(0, 0) rotate(0deg) scale(1);
        }
      }


      
</style>
<style>
      .exists-alert{
        --background: rgb(255,255,0);
      }
      .success-alert{
        --background: rgb(3, 249, 3);
      }
</style>


