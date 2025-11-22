import SwiftUI
import SmartSpectraSwiftSDK

struct ContentView: View {
    @ObservedObject var sdk = SmartSpectraSwiftSDK.shared
    @StateObject private var uploader = VitalsUploader()
    
    init() {
        let apiKey = Configuration.smartSpectraAPIKey
        sdk.setApiKey(apiKey)
//        sdk.setSmartSpectraMode(.spot)
//        sdk.setMeasurementDuration(60.0)
    }
    
    var body: some View {
        SmartSpectraView()
    }
}
