<template>
  <ion-page :key="{keyVal}">
    <div class="container">
      <div class="barcode-scanner--area--container">
        <div class="relative">
          <p>Aim your camera at a QR Code {{resval}}</p>
        </div>
        <div class="square surround-cover" ref="surroundCover">
          <div class="barcode-scanner--area--outer surround-cover">
            <div class="barcode-scanner--area--inner"></div>
          </div>
        </div>
      </div>
    </div>
  </ion-page>
</template>

<script>
import { computed, defineComponent, onMounted, onUnmounted, onUpdated } from 'vue';
import { IonPage,alertController,loadingController, toastController} from '@ionic/vue';
import {ref} from 'vue';
import { BarcodeScanner } from '@capacitor-community/barcode-scanner';
import {useRouter,onBeforeRouteLeave,} from 'vue-router';
import { useStore } from 'vuex';
import {qrParser,} from '@/shared/helper.js';
import axios from 'axios';
import { Haptics } from '@capacitor/haptics';
// import { createAnimation } from '@ionic/vue';
import {NativeAudio} from '@capacitor-community/native-audio'



export default  defineComponent({
  name: 'ScanPage',
  components: { IonPage},
  setup(){
    const router = useRouter();

    const res = ref("blank");

    const resval = ref("blank");

    const keyVal = ref(1);


    const showOrNot = ref(false);

    

    const store = useStore()

    onMounted(async () => {await startScan()})

    onUpdated(async () => {await startScan()})

    onUnmounted(async () => {await BarcodeScanner.stopScan()})


    onBeforeRouteLeave(async () => { await stopScanBack()})

    const inOrOut = computed(()=> store.getters['apis/getInOrOut'])

    const outscanType = computed(()=> store.getters['apis/getOutScanType'])

    const surroundCover = ref(null)

    NativeAudio.preload({
    assetId: "fire",
    assetPath: "public/assets/fire.mp3",
    audioChannelNum: 1,
    isUrl: false,
    volume: 1.0,
      });



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
                if(response.data == 'Already EXISTS' || response.data == 'EXISTS'){
                  loading.dismiss()
                  // await existsAlert()
                  await warningToast('The packet was already scanned')
                  await hapticsVibrate(300)
                }else if(response.status == 200 || response.status == 201){
                  loading.dismiss()
                  // await successAlert()
                  await hapticsVibrate(100)
                  await successToast('Successfully Scanned')
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
                retVal.outscanType = outscanType.value;
                const response = await axios.post("https://fifo-update.cokit.tech/fifo/outputScan", retVal);
                const loading = await presentLoading();
                resval.value = response.status
                console.log(resval.value)
                console.log("out response: ",response.data)
                if(response.data == 'EXISTS'){
                  loading.dismiss()
                  // await existsAlert()
                  await warningToast('The packet was already scanned')
                  await hapticsVibrate(300)
                } else if(response.data == 'INPUT SCAN NOT FOUND'){
                  loading.dismiss()
                  // await successAlert()
                  await warningToast('The packet was never input scanned',2000)
                  await hapticsVibrate(100)
                } 
                else if(response.data[0] == 'PACKET FOLLOWS FIFO'){
                  loading.dismiss()
                  // await successAlert()
                  await successToast('Successfully Scanned')
                  await hapticsVibrate(100)
                } else if(response.data[0] == 'PACKET DOES NOT FOLLOW FIFO'){
                  loading.dismiss()
                  await hapticsVibrate(300)
                  await noFifoAlert(response.data[1])
                } else if(response.status == 201 && outscanType.value == 'used' && response.data[0] == "PACKET SENT TO USED PILE"){
                  loading.dismiss()
                  await hapticsVibrate(300)
                  await warningToast('Usage recorded',2000)
                } else if(response.status == 201 && outscanType.value == 'wasted' && response.data[0] == "PACKET SENT TO WASTED PILE"){
                  loading.dismiss()
                  await hapticsVibrate(300)
                  await warningToast('Wastage recorded',2000)
                }
                
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

    const noFifoAlert = async (dataObj) => {
      surroundCover.value.style.boxShadow = "0 0 0 99999px rgba(153, 0, 0, 0.7)";
      const alert = await alertController
        .create({
          cssClass: 'noFifo-alert',
          header: 'Alert',
          subHeader: 'FIFO NOT FOLLOWED',
          message: 'Please get this packet with date of expiry '+ dataObj.expDate +' instead',
          buttons: ['OK'],
        });
      await alert.present();

      const { role } = await alert.onDidDismiss();
      console.log('onDidDismiss resolved with role', role);
    }


    const warningToast = async (msgg,durr=900) => {
      surroundCover.value.style.boxShadow = "0 0 0 99999px rgba(255, 255, 0, 0.7)";

      NativeAudio.play({
          assetId: 'fire',
          // time: 6.0 - seek time
      });
      
      const toast = await toastController
        .create({
          message: msgg,
          duration: durr,
          cssClass: 'warningt'
        })
      return toast.present();
    }

    const successToast = async (msgg) => {
      surroundCover.value.style.boxShadow = "0 0 0 99999px rgba(0, 153, 51, 0.7)";
      const toast = await toastController
        .create({
          message: msgg,
          duration: 900,
          cssClass: 'successt'
        })
      return toast.present();
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

    const hapticsVibrate = async (duration) => {
      await Haptics.vibrate(duration);
    };

    const checkPermission = async () => {
      const status = await BarcodeScanner.checkPermission({ force: true });

      if (status.granted) {
        // the user granted permission
        return true;
      }

      const status2 = await BarcodeScanner.checkPermission();

      if (status2.denied) {
        // the user denied permission for good
        // redirect user to app settings if they want to grant it anyway
        const c = confirm(
          'If you want to grant permission for using your camera, enable it in the app settings.',
        );
        if (c) {
          BarcodeScanner.openAppSettings();
        }
      }

      return false;
    };
    const stopScan = async () => {
      showOrNot.value = false
      await BarcodeScanner.showBackground();
      await BarcodeScanner.stopScan();
      keyVal.value += 1;
    };
    const stopScanBtn = async () => {
      showOrNot.value = false
      await BarcodeScanner.showBackground();
      await BarcodeScanner.stopScan();
      router.replace({path:'/tabs/tab2'})
    };
    const stopScanBack = async () => {
      showOrNot.value = false
      BarcodeScanner.showBackground();
      await BarcodeScanner.stopScan();
      await BarcodeScanner.stopScan();
    };
    return {
      startScan,
      stopScanBtn,
      stopScan,
      checkPermission,
      existsAlert,
      successAlert,
      res,
      showOrNot,
      resval,
      keyVal,
      warningToast,
      successToast,
      hapticsVibrate,
      surroundCover
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
      .noFifo-alert{
        --background: rgb(124, 4, 4);
      }
      .successt{
        --background: rgb(4, 111, 4);
      }
      .warningt{
        --background: rgb(188, 188, 7);
      }
</style>


