import { useRef, useState } from 'react';
import {
  FlatList,
  Image,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { radius, shadowMd } from '@/theme/tokens';
import { Button } from '@/components/ui/Button';
import { T } from '@/components/ui/T';
import { PressableScale } from '@/components/ui/PressableScale';

const PHOTO =
  'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&w=1000&q=80';

const PAGES = [0, 1, 2];

function Bullet({
  icon,
  title,
  body,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
}) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: radius.md,
          backgroundColor: c.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon} size={21} color={c.onPrimarySoft} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <T kind="bodyStrong">{title}</T>
        <T kind="small" color={c.muted}>
          {body}
        </T>
      </View>
    </View>
  );
}

function Cover({
  children,
  bg,
  tag,
}: {
  children?: React.ReactNode;
  bg: string;
  tag?: string;
}) {
  const { c } = useTheme();
  return (
    <View style={{ marginHorizontal: -16, height: 340, backgroundColor: bg }}>
      {children}
      <View
        style={{
          position: 'absolute',
          top: -60,
          right: -40,
          width: 180,
          height: 180,
          borderRadius: 90,
          backgroundColor: '#FFFFFF',
          opacity: 0.08,
        }}
      />
      <View
        style={{
          position: 'absolute',
          bottom: -50,
          left: -30,
          width: 140,
          height: 140,
          borderRadius: 70,
          backgroundColor: '#FFFFFF',
          opacity: 0.06,
        }}
      />
      {tag ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 28,
            alignItems: 'center',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              backgroundColor: c.overlay,
              borderRadius: radius.pill,
              paddingHorizontal: 16,
              height: 38,
            }}
          >
            <Ionicons name="leaf-outline" size={15} color="#FFFFFF" />
            <T kind="bodyStrong" color="#FFFFFF">
              {tag}
            </T>
          </View>
        </View>
      ) : null}
    </View>
  );
}

export default function Onboarding() {
  const router = useRouter();
  const { c, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const pageWidth = width - 32;
  const [index, setIndex] = useState(0);
  const listRef = useRef<FlatList<number>>(null);

  const seen = async (href: '/(auth)/sign-up' | '/(auth)/sign-in') => {
    await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    router.replace(href);
  };

  const goTo = (page: number) => {
    setIndex(page);
    listRef.current?.scrollToIndex({ index: page, animated: true });
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    setIndex(page);
  };

  const handlePrimary = () => {
    if (index < PAGES.length - 1) {
      goTo(index + 1);
    } else {
      seen('/(auth)/sign-up');
    }
  };

  const sheet = (content: React.ReactNode) => (
    <View
      style={{
        backgroundColor: c.surface,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        marginHorizontal: -16,
        marginTop: -32,
        paddingHorizontal: 24,
        paddingTop: 26,
        paddingBottom: 20,
        minHeight: 420,
        ...shadowMd(mode),
      }}
    >
      {content}
      <View style={{ marginTop: 'auto', paddingTop: 22, gap: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {PAGES.map((p) => (
            <PressableScale
              key={p}
              onPress={() => goTo(p)}
              style={{
                width: p === index ? 24 : 8,
                height: 8,
                borderRadius: radius.pill,
                backgroundColor: p === index ? c.primary : c.muted,
                opacity: p === index ? 1 : 0.35,
              }}
            />
          ))}
        </View>
        <Button
          title={index < PAGES.length - 1 ? 'Continuer' : 'Créer un compte'}
          iconAfter="arrow-forward"
          onPress={handlePrimary}
        />
        <Button
          title="J'ai déjà un compte"
          variant="ghost"
          icon="log-in-outline"
          onPress={() => seen('/(auth)/sign-in')}
        />
      </View>
    </View>
  );

  const renderPage = (page: number) => {
    if (page === 0) {
      return (
        <View>
          <View style={{ marginHorizontal: -16, height: 340, backgroundColor: c.surface2 }}>
            <Image
              source={{ uri: PHOTO }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
            <View
              style={{
                position: 'absolute',
                left: 16,
                bottom: 44,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 8,
                backgroundColor: c.overlay,
                borderRadius: radius.pill,
                paddingHorizontal: 16,
                height: 38,
              }}
            >
              <Ionicons name="leaf-outline" size={15} color="#FFFFFF" />
              <T kind="bodyStrong" color="#FFFFFF">
                Communauté responsable
              </T>
            </View>
          </View>
          {sheet(
            <View style={{ gap: 12 }}>
              <T kind="overline" color={c.primary}>
                Bienvenue sur LBaraka
              </T>
              <T kind="display">Prêtez et partagez dans votre quartier.</T>
              <T kind="body" color={c.muted}>
                Dons, prêts et locations solidaires entre voisins, avec cautions protégées et
                points relais de confiance.
              </T>
            </View>,
          )}
        </View>
      );
    }
    if (page === 1) {
      return (
        <View>
          <Cover bg={c.primary} tag="Échanges protégés">
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 }}>
              <Ionicons name="shield-checkmark" size={92} color="#FFFFFF" style={{ opacity: 0.95 }} />
            </View>
          </Cover>
          {sheet(
            <View style={{ gap: 18 }}>
              <View style={{ gap: 10 }}>
                <T kind="overline" color={c.primary}>
                  Confiance
                </T>
                <T kind="display">Louez en toute confiance.</T>
              </View>
              <Bullet
                icon="shield-checkmark-outline"
                title="Cautions protégées"
                body="Chaque location est couverte en cas d'imprévu."
              />
              <Bullet
                icon="document-text-outline"
                title="Contrats bilingues PDF"
                body="Un contrat clair en français et en arabe."
              />
              <Bullet
                icon="qr-code-outline"
                title="QR de remise en point relais"
                body="Remise et retour scannés en un geste."
              />
            </View>,
          )}
        </View>
      );
    }
    return (
      <View>
        <Cover bg={c.ink} tag="100% local">
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 40 }}>
            <Ionicons name="people" size={92} color={c.bg} style={{ opacity: 0.95 }} />
          </View>
        </Cover>
        {sheet(
          <View style={{ gap: 18 }}>
            <View style={{ gap: 10 }}>
              <T kind="overline" color={c.primary}>
                Quartier
              </T>
              <T kind="display">Votre quartier d&apos;abord.</T>
            </View>
            <Bullet
              icon="people-outline"
              title="Entraide entre voisins"
              body="Prêtez et recevez autour de chez vous."
            />
            <Bullet
              icon="restaurant-outline"
              title="Food rescue anti-gaspi"
              body="Partagez les surplus avant qu'ils ne se perdent."
            />
            <Bullet
              icon="map-outline"
              title="Points relais partenaires"
              body="Des commerces de confiance près de chez vous."
            />
          </View>,
        )}
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ position: 'absolute', top: insets.top + 8, right: 16, zIndex: 10 }}>
        <PressableScale
          onPress={() => seen('/(auth)/sign-in')}
          style={{
            backgroundColor: c.overlay,
            borderRadius: radius.pill,
            paddingHorizontal: 18,
            height: 38,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <T kind="bodyStrong" color="#FFFFFF">
            Passer
          </T>
        </PressableScale>
      </View>
      <FlatList
        ref={listRef}
        data={PAGES}
        keyExtractor={(item) => String(item)}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, i) => ({
          length: pageWidth,
          offset: pageWidth * i,
          index: i,
        })}
        onMomentumScrollEnd={onScrollEnd}
        onScrollToIndexFailed={(info) => {
          listRef.current?.scrollToOffset({
            offset: info.index * pageWidth,
            animated: true,
          });
        }}
        renderItem={({ item }) => (
          <View style={{ width: pageWidth, paddingHorizontal: 16 }}>{renderPage(item)}</View>
        )}
      />
      <View style={{ alignItems: 'center', paddingBottom: insets.bottom + 10, paddingTop: 4 }}>
        <T kind="caption" color={c.muted}>
          En continuant, vous acceptez nos conditions d&apos;utilisation
        </T>
      </View>
    </View>
  );
}
