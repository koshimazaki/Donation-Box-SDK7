import {
  engine,
  Transform,
  GltfContainer,
  MeshRenderer,
  InputAction,
  pointerEventsSystem,
  inputSystem, executeTask,Animator,
  PointerEventType,
} from '@dcl/sdk/ecs'

import { Color4, Vector3, Quaternion } from '@dcl/sdk/math'
import ReactEcs, { Button, Label, ReactEcsRenderer, UiEntity } from '@dcl/sdk/react-ecs'
import { getUserData } from '~system/UserIdentity'
import * as ui from 'dcl-ui-toolkit'
//import crypto from 'dcl-crypto-toolkit'
import * as crypto from 'dcl-crypto-toolkit';


let myWallet = `0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee`

let donationbAmount: string = '';



// Animation delay setup 

function donationAnimationSystem(dt: number) {
  if (donationAnimationTimeElapsed > 0) {
    donationAnimationTimeElapsed += dt;

    if (donationAnimationTimeElapsed >= donationAnimationDuration) {
      // Switch to idle animation
      Animator.playSingleAnimation(donationsBoxModel, 'DonationIdle_Action', true);
      // Reset or disable the timer
      donationAnimationTimeElapsed = 0;
    }
  }
}

engine.addSystem(donationAnimationSystem);

let donationAnimationTimeElapsed = 0;
const donationAnimationDuration = 2.5; // Duration in seconds


// Box model and animator 

const donationsBoxModel = engine.addEntity()
GltfContainer.create(donationsBoxModel, { src: 'models/DonationsBox.glb' })
MeshRenderer.create(donationsBoxModel)
Transform.create(donationsBoxModel, {
  position: Vector3.create(6.5, 1, 12),
  rotation: Quaternion.create(0, 0, 0, 1),
  scale: Vector3.create(1, 1, 1)
})


Animator.create(donationsBoxModel, {

// Animator states idle and donation 
  states:[{
     clip: "Donation_Action", 
     playing: false,
     loop: false,

  }, {
     clip: "DonationIdle_Action",
     playing: true,
     loop: true,
     shouldReset: true,
  }]
})

// Donation action and UI 

pointerEventsSystem.onPointerDown(
  {
    entity: donationsBoxModel,
    opts: { button: InputAction.IA_PRIMARY, hoverText: 'Donate' },
  },
  () => { 
    Donation.show(); // Show the donation UI panel
  }
);


const Donation = ui.createComponent(ui.FillInPrompt, {
  title: 'Are you sure? \n You are about to donate',
  placeholder: '$Mana',
  acceptLabel: 'Donate',
  useDarkTheme: true,
  onAccept: (amount: string) => {
    console.log('accepted values:', amount, 'Mana')
    executeTask(async () => {
      try {
        const numericAmount = parseFloat(amount); // Convert to number
        if (!isNaN(numericAmount)) {
          await crypto.mana.send(myWallet, numericAmount, true); // Send the transaction
          // Handle the successful transaction
        } else {
          console.error('Invalid donation amount');
        }
      } catch (error) {
        console.error('Transaction failed:', error);
        // Handle the error
      }
    });
    Donation.hide();
   
    // Set a timeout to switch to idle animation after the donation animation duration

    Animator.playSingleAnimation(donationsBoxModel,'Donation_Action', false);

    donationAnimationTimeElapsed = 0.00001; // enable the timer

  },
  
});


// UI setup 

export function setupUi() {
  ReactEcsRenderer.setUiRenderer(ui.render);


  engine.addSystem(() => {
    if (inputSystem.isTriggered(InputAction.IA_PRIMARY, PointerEventType.PET_DOWN)) {
      Donation.show(); 
    }
  })
}

