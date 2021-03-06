import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { Cita } from '../citas';
import { Router } from "@angular/router";
import { FirestoreService } from '../firestore.service';
import {AlertController, LoadingController, ToastController} from "@ionic/angular";
import {ImagePicker} from '@ionic-native/image-picker/ngx';

@Component({
  selector: "app-cita",
  templateUrl: "./cita.page.html",
  styleUrls: ["./cita.page.scss"]
})
  
export class CitaPage implements OnInit {
  //variable que almacena la cita
  document: any = {
    id: "",
    data: {} as Cita
  };
  id = null;
  constructor(private activatedRoute: ActivatedRoute, private firestoreService: FirestoreService, private router: Router,public alertController: AlertController,
              private loadingController: LoadingController,
              private toastController: ToastController,
              private imagePicker: ImagePicker) {}

//añadir al constructor ActivateRoute, para poder usarlo en ngOnInit, en el que obtenemos el valor de ‘id’ y lo metemos en una variable. 

  ngOnInit() {
    this.id = this.activatedRoute.snapshot.paramMap.get("id");
    this.obtenerCita();
  }

  citaEditando: Cita;
  idCitaSelect: String;

  clicBotonInsertar() {
    this.firestoreService.insertar("citas", this.document.data).then(() => {
      console.log('Cita creada correctamente!');
      this.citaEditando= {} as Cita;
    }, (error) => {
      console.error(error);
    });
    this.router.navigate(["/home/"]);
  }
    //Mensaje de confirmacion de borrado
    async alertaConfirmacion() {
      const alert = await this.alertController.create({
        cssClass: 'my-custom-class',
        header: 'Citas Peluquería',
        subHeader: 'Confirmación de borrado',
        message: '¿Está seguro que desea eliminar esta cita y todos los datos relacionados con ella?',
        buttons: [
          {
            text: 'OK',
            role: 'submit',
            handler: () => {
              this.clicBotonBorrar();
            }
          }, 
            {
              text: 'Cancel',
              role: 'cancel',
              handler: () => {
                console.log('Cancel clicked');
              }
            }
          ]
      });
  
      await alert.present();
    }

  clicBotonBorrar() {
    this.firestoreService.borrar("citas", this.id).then(() => {
    this.router.navigate(["/home/"]);
    })
  }
  
  clicBotonModificar() {
    this.firestoreService.actualizar("citas", this.id, this.document.data).then(() => {
      // Limpiar datos de pantalla
      //this.citaEditando = {} as Cita;
      this.router.navigate(["/home/"]);
  
    })
  }
  obtenerCita(){
    this.firestoreService.consultarPorId("citas", this.id).subscribe((resultado) => {
      // Preguntar si se hay encontrado un document con ese ID
      if(resultado.payload.data() != null) {
        this.document.id = resultado.payload.id
        this.document.data = resultado.payload.data();
      } else {
        // No se ha encontrado un document con ese ID. Vaciar los datos que hubiera
        this.document.data = {} as Cita;
      } 
    });

  }

  //Metodo que se invocará para que aparezca el selector de imagenes
  async uploadImagePicker(){

    //Mensaje de espera mientras se sube la imagen
    const loading = await this.loadingController.create({
      message: 'Please wait...'
    });

    //Mensaje de finalizacion de subida de la imagen
    const toast = await this.toastController.create({
      message:'Image was updated successfully',
      duration:300
    });

    //Comprobar si la aplicacion tiene permisos de lectura
    this.imagePicker.hasReadPermission().then(
      (result) => {
        //Si no tiene permiso de lectura se solicita al usuario
        if(result== false){
          this.imagePicker.requestReadPermission();
        
        }else{
        //Abrir selector de imagenes (ImagePicker)
        this.imagePicker.getPictures({
          maximumImagesCount: 1,  //Permitir solo 1 imagen
          outputType:1            //1= Base64
        }).then(
          (results)=> {  // En la variable results estan las imagenes seleccionadas
          
            //Carpeta del Storage donde se almacenara la imagen
            let nombreCarpeta= "imagenesOscar";
            //Recorrer todas las imagenes que haya seleccionado el usuario aunque realmente solo sera 1 como se ha indicado en las opciones
            for(var i=0; i<results.length; i++){
              //Mostrar el mensaje de espera
              loading.present();
              //Asignar el nombre de la imagen en funcion de la hora actual para evitar duplicidades
              let nombreImagen =`${new Date().getTime()}`;
              //Llamar al metodo que sube la imagen al storage
              this.firestoreService.uploadImage(nombreCarpeta, nombreImagen, results[i])
              .then(snapshot=> {
                snapshot.ref.getDownloadURL()
                .then(downloadURL =>{
                  //En la variable downloadURL de tiene la descarga de la imagen
                  console.log("downloadURL:" + downloadURL);
                  //Mostrar el mensaje de finalizacion de la subida
                  toast.present();
                  //Ocultar mensaje de espera
                  loading.dismiss();
                })
              })
            }
          },
          (err)=>{
            console.log(err)
          }
        );
      }
    }, (err) =>{
      console.log(err);
    });

  }

  async deleteFile(fileURL) {
    const toast = await this.toastController.create({
      message: 'File was deleted successfully',
      duration: 3000
    });
    this.firestoreService.deleteFileFromURL(fileURL)
      .then(()=>{
        toast.present();

      }, (err) => {
          console.log(err);
      });
  }
}

