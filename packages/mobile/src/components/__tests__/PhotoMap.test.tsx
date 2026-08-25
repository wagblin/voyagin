import { Image, Text } from 'react-native';
import { Marker } from 'react-native-maps';
import TestRenderer, { act } from 'react-test-renderer';
import { PhotoMap } from '../PhotoMap';
import { cloudinaryThumbnailUrl } from '../../lib/cloudinary';
import type { Photo } from '../../lib/photosApi';

// react-native-maps is a native module and has no Jest-compatible implementation: MapView,
// Marker, Callout and Polyline are stubbed to plain Views so their children still render.
// The Marker stub doesn't need to explicitly wire `onPress` to anything itself — a
// react-test-renderer test instance always exposes the raw props its parent passed it
// (verified with a throwaway spike), so `.props.onPress` is reachable on a found Marker
// instance regardless of what the stub body does with the prop.
jest.mock('react-native-maps', () => {
  const { View } = require('react-native');

  const MapView = ({ children }: { children?: React.ReactNode }) => <View>{children}</View>;
  const Marker = ({ children }: { children?: React.ReactNode; onPress?: () => void }) => <View>{children}</View>;
  const Callout = ({ children }: { children?: React.ReactNode }) => <View>{children}</View>;
  const Polyline = () => null;

  return { __esModule: true, default: MapView, Marker, Callout, Polyline };
});

function buildPhoto(overrides: Partial<Photo>): Photo {
  return {
    id: 'photo-1',
    tripId: 'trip-1',
    uploaderId: 'user-1',
    imageUrl: 'https://res.cloudinary.com/demo/image/upload/photo-1.jpg',
    location: { latitude: 48.8566, longitude: 2.3522 },
    takenAt: '2026-09-01T10:00:00.000Z',
    caption: null,
    ...overrides,
  };
}

function tapMarker(renderer: TestRenderer.ReactTestRenderer, index: number) {
  const markers = renderer.root.findAllByType(Marker);
  const marker = markers[index];
  if (!marker) {
    throw new Error(`No marker found at index ${index}`);
  }
  act(() => {
    marker.props.onPress?.();
  });
}

function findThumbnailImage(renderer: TestRenderer.ReactTestRenderer, uri: string) {
  return renderer.root.findAllByType(Image).find((image) => image.props.source?.uri === uri);
}

describe('PhotoMap', () => {
  it('shows no photo overlay before any marker is tapped', () => {
    const photo = buildPhoto({});
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<PhotoMap photos={[photo]} />);
    });

    expect(findThumbnailImage(renderer!, cloudinaryThumbnailUrl(photo.imageUrl, 320))).toBeUndefined();
  });

  it('shows the tapped photo thumbnail, caption and date in an overlay when its marker is pressed', () => {
    const photo = buildPhoto({
      id: 'photo-1',
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/photo-1.jpg',
      caption: 'Le clocher au coucher du soleil',
      takenAt: '2026-09-01T10:00:00.000Z',
    });
    const thumbnailUrl = cloudinaryThumbnailUrl(photo.imageUrl, 320);
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<PhotoMap photos={[photo]} />);
    });
    expect(findThumbnailImage(renderer!, thumbnailUrl)).toBeUndefined();

    tapMarker(renderer!, 0);

    expect(findThumbnailImage(renderer!, thumbnailUrl)).toBeDefined();
    const texts = renderer!.root.findAllByType(Text).map((node) => node.props.children);
    expect(texts).toContainEqual(photo.caption);
    expect(texts).toContainEqual(new Date(photo.takenAt).toLocaleString());
  });

  it('shows the thumbnail of the photo whose marker was actually pressed, not another one', () => {
    const firstPhoto = buildPhoto({
      id: 'photo-1',
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/photo-1.jpg',
      location: { latitude: 48.8566, longitude: 2.3522 },
    });
    const secondPhoto = buildPhoto({
      id: 'photo-2',
      imageUrl: 'https://res.cloudinary.com/demo/image/upload/photo-2.jpg',
      location: { latitude: 45.764, longitude: 4.8357 },
    });
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<PhotoMap photos={[firstPhoto, secondPhoto]} />);
    });
    tapMarker(renderer!, 1);

    expect(findThumbnailImage(renderer!, cloudinaryThumbnailUrl(secondPhoto.imageUrl, 320))).toBeDefined();
    expect(findThumbnailImage(renderer!, cloudinaryThumbnailUrl(firstPhoto.imageUrl, 320))).toBeUndefined();
  });

  it('hides the overlay again once the close affordance is pressed', () => {
    const photo = buildPhoto({});
    let renderer: TestRenderer.ReactTestRenderer;

    act(() => {
      renderer = TestRenderer.create(<PhotoMap photos={[photo]} />);
    });
    tapMarker(renderer!, 0);
    expect(findThumbnailImage(renderer!, cloudinaryThumbnailUrl(photo.imageUrl, 320))).toBeDefined();

    act(() => {
      renderer!.root.findByProps({ testID: 'photo-modal-close' }).props.onPress();
    });

    expect(findThumbnailImage(renderer!, cloudinaryThumbnailUrl(photo.imageUrl, 320))).toBeUndefined();
  });
});
