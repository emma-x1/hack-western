import SwiftUI
import SmartSpectraSwiftSDK


struct ContentView: View {
    @ObservedObject var sdk = SmartSpectraSwiftSDK.shared


    init() {
        let apiKey = Configuration.smartSpectraAPIKey
        sdk.setApiKey(apiKey)
    }


    var body: some View {
        SmartSpectraView()
    }
}
