package com.pilahub

import android.content.Intent
import android.util.Log
import com.facebook.react.ReactActivity
import com.facebook.react.ReactActivityDelegate
import com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.fabricEnabled
import com.facebook.react.defaults.DefaultReactActivityDelegate
//import com.margelo.nitro.nitroscreenrecorder.NitroScreenRecorder

class MainActivity : ReactActivity() {
  
  override fun getMainComponentName(): String = "PilaHub" 

  override fun createReactActivityDelegate(): ReactActivityDelegate =
    DefaultReactActivityDelegate(this, mainComponentName, fabricEnabled)

  override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
    super.onActivityResult(requestCode, resultCode, data)

    Log.d("MainActivity", "onActivityResult: requestCode=$requestCode resultCode=$resultCode")

    try {
//      NitroScreenRecorder.handleActivityResult(requestCode, resultCode, data)
      Log.d("MainActivity", "noi dung")
    } catch (e: Exception) {
      Log.e("MainActivity", "Error handling activity result: ${e.message}")
      e.printStackTrace()
    }
  }
}
