import Foundation

struct Configuration {
    static var smartSpectraAPIKey: String {
        guard let path = Bundle.main.path(forResource: "Config", ofType: "plist"),
              let config = NSDictionary(contentsOfFile: path),
              let apiKey = config["SMARTSPECTRA_API_KEY"] as? String else {
            fatalError("Config.plist not found or SMARTSPECTRA_API_KEY missing")
        }
        return apiKey
    }
}