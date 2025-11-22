import Foundation
import Combine
import SmartSpectraSwiftSDK

final class VitalsUploader: ObservableObject {
    private let sdk = SmartSpectraSwiftSDK.shared
    private var cancellables = Set<AnyCancellable>()

    // configure your backend endpoint
    private let endpoint = URL(string: "https://hitachi-normally-found-courts.trycloudflare.com/vitals")!

    init() {
        sdk.$metricsBuffer
            .compactMap { $0 }
            .throttle(for: .seconds(1),
                      scheduler: DispatchQueue.global(qos: .background),
                      latest: true)
            .sink { [weak self] buffer in
                self?.send(buffer: buffer)
            }
            .store(in: &cancellables)
    }

    private func send(buffer: MetricsBuffer) {
        // Grab latest values if available
        guard
            let latestPulse = buffer.pulse.rate.last,
            let latestBreathing = buffer.breathing.rate.last
        else {
            return
        }

        let payload: [String: Any] = [
            "timestamp_s": latestPulse.time,           
            "heart_rate_bpm": latestPulse.value,
            "breathing_rate_rpm": latestBreathing.value
        ]

        guard let jsonData = try? JSONSerialization.data(withJSONObject: payload) else {
            return
        }

        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = jsonData

        URLSession.shared.dataTask(with: request) { _, response, error in
            if let error = error {
                print("Vitals upload failed: \(error)")
                return
            }
            if let http = response as? HTTPURLResponse, http.statusCode >= 300 {
                print("Vitals upload HTTP \(http.statusCode)")
            }
        }.resume()
    }
}
