import CoreLocation
import Foundation

final class WpcLocator: NSObject, CLLocationManagerDelegate {
  let manager = CLLocationManager()

  func start() {
    manager.delegate = self
    manager.desiredAccuracy = kCLLocationAccuracyThreeKilometers
    let status = manager.authorizationStatus
    if status == .notDetermined {
      manager.requestWhenInUseAuthorization()
      return
    }
    wpc_follow(status)
  }

  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    wpc_follow(manager.authorizationStatus)
  }

  func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
    guard let loc = locations.last, loc.horizontalAccuracy >= 0 else { return }
    print(String(format: "%.5f,%.5f", loc.coordinate.latitude, loc.coordinate.longitude))
    fflush(stdout)
    exit(0)
  }

  func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
    fputs("\(error.localizedDescription)\n", stderr)
    exit(2)
  }

  private func wpc_follow(_ status: CLAuthorizationStatus) {
    switch status {
    case .authorizedAlways, .authorizedWhenInUse:
      manager.startUpdatingLocation()
    case .denied, .restricted:
      fputs("denied\n", stderr)
      exit(3)
    default:
      break
    }
  }
}

let locator = WpcLocator()
locator.start()
RunLoop.main.run(until: Date().addingTimeInterval(25))
fputs("timeout\n", stderr)
exit(4)
