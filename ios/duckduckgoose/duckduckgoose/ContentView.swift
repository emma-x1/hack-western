import SwiftUI
import SmartSpectraSwiftSDK

struct ContentView: View {
    @ObservedObject var sdk = SmartSpectraSwiftSDK.shared
    @State private var pulseData: [String] = []
    @State private var breathingData: [String] = []
    
    var body: some View {
        VStack(spacing: 20) {
            Text("Vital Signs Monitor")
                .font(.title)
                .fontWeight(.bold)
            
            SmartSpectraView()
                .frame(height: 400)
            
            VStack(alignment: .leading) {
                Text("Pulse Data:")
                    .font(.headline)
                ScrollView {
                    ForEach(pulseData, id: \.self) { data in
                        Text(data)
                            .font(.caption)
                    }
                }
                .frame(height: 100)
            }
            
            VStack(alignment: .leading) {
                Text("Breathing Data:")
                    .font(.headline)
                ScrollView {
                    ForEach(breathingData, id: \.self) { data in
                        Text(data)
                            .font(.caption)
                    }
                }
                .frame(height: 100)
            }
            
            Button("Capture Vitals") {
                captureVitals()
            }
            .padding()
            .background(Color.blue)
            .foregroundColor(.white)
            .cornerRadius(10)
        }
        .padding()
        .onAppear {
            let apiKey = Configuration.smartSpectraAPIKey
            sdk.setApiKey(apiKey)
        }
    }
    
    func captureVitals() {
        guard let metrics = sdk.metricsBuffer else {
            print("No metrics available yet")
            return
        }
        
        pulseData.removeAll()
        breathingData.removeAll()
        
        if !metrics.pulse.rate.isEmpty {
            metrics.pulse.rate.forEach { measurement in
                let data = "Pulse: \(measurement.value) BPM at \(measurement.time)s"
                print(data)
                pulseData.append(data)
            }
        } else {
            print("No pulse data yet")
        }
        
        if !metrics.breathing.rate.isEmpty {
            metrics.breathing.rate.forEach { rate in
                let data = "Breathing: \(rate.value) RPM at \(rate.time)s"
                print(data)
                breathingData.append(data)
            }
        } else {
            print("No breathing data yet")
        }
        
        print("Total measurements collected:")
        print("- Pulse readings: \(metrics.pulse.rate.count)")
        print("- Breathing readings: \(metrics.breathing.rate.count)")
    }
}
