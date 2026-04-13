import React, { useState } from 'react';
import {
  View, ScrollView, TouchableOpacity, Text, TextInput,
  ActivityIndicator, Alert, Image, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useImagePicker } from '../../src/hooks/useImagePicker';
import { useAudioRecorder } from '../../src/hooks/useAudioRecorder';
import { useAuth } from '../../src/context/AuthContext';
import { PhotoGrid } from '../../src/components/PhotoGrid';
import { ToneChips } from '../../src/components/ToneChips';
import { UsageBar } from '../../src/components/UsageBar';
import { PromoModal } from '../../src/components/PromoModal';
import { Dropdown } from '../../src/components/Dropdown';
import { StepIndicator } from '../../src/components/StepIndicator';
import { COLORS, SPACING, RADIUS, TYPOGRAPHY, SHADOWS } from '../../src/constants/theme';
import {
  PROPERTY_TYPES, TARGET_BUYERS, WRITING_TONES, MLS_PLATFORMS, STATE_CITIES,
} from '../../src/constants/data';
import { buildPrompt, cleanFairHousing, parseResults } from '../../src/utils/promptBuilder';
import { generateDescription, transcribeAudio } from '../../src/services/api';

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { photos, loading: photoLoading, pickFromLibrary, pickFromCamera, removePhoto } = useImagePicker();
  const { isRecording, loading: audioLoading, startRecording, stopRecording, getBase64 } = useAudioRecorder();
  const { canGenerate, incrementUsage, redeemPromoCode, isPro, hasPromo, usageCount } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);
  const [promoLoading, setPromoLoading] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  // Form state
  const [propertyType, setPropertyType] = useState('');
  const [price, setPrice] = useState('');
  const [state, setState] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [sqft, setSqft] = useState('');
  const [lotSize, setLotSize] = useState('');
  const [targetBuyer, setTargetBuyer] = useState('');
  const [highlights, setHighlights] = useState('');
  const [selectedTone, setSelectedTone] = useState('recommended');
  const [mlsLimit, setMlsLimit] = useState('0');

  // Dropdown data
  const availableCities = state && STATE_CITIES[state] ? STATE_CITIES[state] : [];
  const propertyTypeItems = PROPERTY_TYPES.map(t => ({ label: t, value: t }));
  const stateItems = Object.keys(STATE_CITIES).sort().map(s => ({ label: s, value: s }));
  const cityItems = availableCities.map(c => ({ label: c, value: c }));
  const targetBuyerItems = TARGET_BUYERS.map(b => ({ label: b, value: b }));
  const mlsItems = MLS_PLATFORMS.map(p => ({ label: p.label, value: String(p.value) }));

  const handleVoiceToggle = async () => {
    try {
      if (isRecording) {
        const uri = await stopRecording();
        if (uri) {
          setTranscribing(true);
          const base64Audio = await getBase64(uri);
          const transcription = await transcribeAudio(base64Audio);
          setHighlights(prev => prev ? prev + ' ' + transcription : transcription);
          setTranscribing(false);
        }
      } else {
        await startRecording();
      }
    } catch (error) {
      setTranscribing(false);
      Alert.alert('Error', error.message || 'Voice recording failed');
    }
  };

  const handleGenerate = async () => {
    if (photos.length === 0) {
      Alert.alert('Error', 'Please upload at least one property photo');
      return;
    }
    if (!canGenerate()) {
      setShowPromoModal(true);
      return;
    }
    try {
      setGenerating(true);
      const prompt = buildPrompt({
        propertyType, price, state, city, neighborhood, yearBuilt,
        bedrooms, bathrooms, sqft, lotSize, targetBuyer, highlights,
        selectedTone, photoCount: photos.length, mlsCharLimit: parseInt(mlsLimit, 10),
      });
      const fullResponse = await generateDescription(photos, prompt);
      const { rawFull, rawMls, rawSocial } = parseResults(fullResponse);
      const cleanFull = cleanFairHousing(rawFull);
      const cleanMls = cleanFairHousing(rawMls);
      const cleanSocial = cleanFairHousing(rawSocial);
      await incrementUsage();
      router.push({
        pathname: '/results',
        params: {
          full: cleanFull.cleaned, mls: cleanMls.cleaned, social: cleanSocial.cleaned,
          fixes: JSON.stringify([...cleanFull.fixes, ...cleanMls.fixes, ...cleanSocial.fixes]),
        },
      });
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to generate description');
    } finally {
      setGenerating(false);
    }
  };

  const handlePromoSubmit = async code => {
    try {
      setPromoLoading(true);
      await redeemPromoCode(code);
      setShowPromoModal(false);
      Alert.alert('Success', 'Code applied — enjoy!');
    } catch (error) {
      throw new Error(error.message || 'Invalid code');
    } finally {
      setPromoLoading(false);
    }
  };

  const canProceedToStep1 = photos.length > 0;

  const inputStyle = {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    fontSize: 14,
    color: COLORS.gray800,
  };

  const cardStyle = {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  };

  // ===== STEP 0: PHOTOS & VOICE =====
  if (currentStep === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.gray50 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: insets.top + SPACING.lg,
            paddingBottom: insets.bottom + SPACING.lg,
            paddingHorizontal: SPACING.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header with Logo */}
          <View style={{ alignItems: 'center', marginBottom: SPACING.xl }}>
            <Image
              source={require('../../assets/logo.png')}
              style={{ height: 60, width: 150, resizeMode: 'contain', marginBottom: SPACING.md }}
            />
            <Text style={{ ...TYPOGRAPHY.h2, color: COLORS.navy, textAlign: 'center' }}>
              Create Perfect Listings
            </Text>
          </View>

          {/* Step Indicator */}
          <StepIndicator currentStep={0} />

          {/* Photo Grid */}
          <View style={{ marginBottom: SPACING.xl }}>
            <Text style={{ ...TYPOGRAPHY.h4, color: COLORS.navy, marginBottom: SPACING.md }}>
              Property Photos
            </Text>
            <Text style={{ ...TYPOGRAPHY.bodySm, color: COLORS.gray600, marginBottom: SPACING.lg }}>
              Upload clear, well-lit photos of the property. We recommend at least 5 photos.
            </Text>
            <PhotoGrid photos={photos} onRemove={removePhoto} onAddPress={pickFromLibrary} loading={photoLoading} maxPhotos={15} />
          </View>

          {/* Camera & Library Buttons */}
          <View style={{ flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.xl }}>
            <TouchableOpacity
              onPress={pickFromCamera}
              disabled={photoLoading}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: SPACING.md,
                backgroundColor: COLORS.white,
                borderRadius: RADIUS.lg,
                paddingVertical: SPACING.lg,
                borderWidth: 1,
                borderColor: COLORS.orange,
                opacity: photoLoading ? 0.6 : 1,
                ...SHADOWS.sm,
              }}
            >
              <Ionicons name="camera" size={20} color={COLORS.orange} />
              <Text style={{ ...TYPOGRAPHY.body, color: COLORS.orange, fontWeight: '600' }}>
                Camera
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={pickFromLibrary}
              disabled={photoLoading}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: SPACING.md,
                backgroundColor: COLORS.orange,
                borderRadius: RADIUS.lg,
                paddingVertical: SPACING.lg,
                opacity: photoLoading ? 0.6 : 1,
                ...SHADOWS.sm,
              }}
            >
              <Ionicons name="image" size={20} color={COLORS.white} />
              <Text style={{ ...TYPOGRAPHY.body, color: COLORS.white, fontWeight: '600' }}>
                Library
              </Text>
            </TouchableOpacity>
          </View>

          {/* Voice Walkthrough */}
          <View style={{ marginBottom: SPACING.xl }}>
            <Text style={{ ...TYPOGRAPHY.h4, color: COLORS.navy, marginBottom: SPACING.md }}>
              Voice Walkthrough (Optional)
            </Text>
            <Text style={{ ...TYPOGRAPHY.bodySm, color: COLORS.gray600, marginBottom: SPACING.lg }}>
              Record a brief walkthrough describing key features. We'll transcribe it automatically.
            </Text>
            <TouchableOpacity
              onPress={handleVoiceToggle}
              disabled={audioLoading || transcribing}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: SPACING.md,
                backgroundColor: isRecording ? COLORS.danger : COLORS.navy,
                paddingVertical: SPACING.lg,
                borderRadius: RADIUS.lg,
                opacity: audioLoading || transcribing ? 0.6 : 1,
                ...SHADOWS.sm,
              }}
            >
              {transcribing ? (
                <>
                  <ActivityIndicator color={COLORS.white} size="small" />
                  <Text style={{ ...TYPOGRAPHY.body, color: COLORS.white, fontWeight: '600' }}>
                    Transcribing...
                  </Text>
                </>
              ) : isRecording ? (
                <>
                  <Ionicons name="stop-circle" size={24} color={COLORS.white} />
                  <Text style={{ ...TYPOGRAPHY.body, color: COLORS.white, fontWeight: '600' }}>
                    Stop Recording
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="mic" size={24} color={COLORS.orange} />
                  <Text style={{ ...TYPOGRAPHY.body, color: COLORS.white, fontWeight: '600' }}>
                    Start Recording
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Next Button */}
          <TouchableOpacity
            onPress={() => setCurrentStep(1)}
            disabled={!canProceedToStep1}
            style={{
              backgroundColor: canProceedToStep1 ? COLORS.orange : COLORS.gray300,
              paddingVertical: SPACING.lg,
              borderRadius: RADIUS.lg,
              alignItems: 'center',
              opacity: canProceedToStep1 ? 1 : 0.6,
              ...SHADOWS.md,
            }}
          >
            <Text style={{ ...TYPOGRAPHY.body, color: COLORS.white, fontWeight: '700' }}>
              Next: Property Details
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Hidden promo/commission code entry — tiny bottom-right icon */}
        <TouchableOpacity
          onPress={() => setShowPromoModal(true)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={{
            position: 'absolute',
            bottom: insets.bottom + SPACING.md,
            right: SPACING.md,
            padding: SPACING.xs,
            opacity: hasPromo ? 0.6 : 0.25,
          }}
          accessibilityLabel="Enter promo or commission code"
        >
          <Ionicons
            name={hasPromo ? 'pricetag' : 'pricetag-outline'}
            size={18}
            color={hasPromo ? COLORS.orange : COLORS.gray400}
          />
        </TouchableOpacity>

        {/* Promo modal (also used by paywall flow on step 2) */}
        <PromoModal
          visible={showPromoModal}
          onDismiss={() => setShowPromoModal(false)}
          onApply={handlePromoSubmit}
          loading={promoLoading}
        />
      </View>
    );
  }

  // ===== STEP 1: PROPERTY DETAILS =====
  if (currentStep === 1) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.gray50 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingTop: insets.top + SPACING.lg,
            paddingBottom: insets.bottom + SPACING.lg,
            paddingHorizontal: SPACING.lg,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl }}>
            <TouchableOpacity onPress={() => setCurrentStep(0)} style={{ marginRight: SPACING.md }}>
              <Ionicons name="chevron-back" size={28} color={COLORS.navy} />
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={{ ...TYPOGRAPHY.h3, color: COLORS.navy }}>Property Details</Text>
              <Text style={{ ...TYPOGRAPHY.bodySm, color: COLORS.gray600, marginTop: SPACING.xs }}>
                Step 2 of 3
              </Text>
            </View>
          </View>

          {/* Card 1: Basic Info */}
          <View style={cardStyle}>
            <Text style={{ ...TYPOGRAPHY.h4, color: COLORS.navy, marginBottom: SPACING.lg }}>
              Basic Information
            </Text>

            <View style={{ marginBottom: SPACING.lg }}>
              <Text style={{ ...TYPOGRAPHY.label, color: COLORS.gray600, marginBottom: SPACING.sm }}>
                Property Type
              </Text>
              <Dropdown
                label="Select type"
                selectedValue={propertyType}
                onValueChange={setPropertyType}
                items={propertyTypeItems}
              />
            </View>

            <View>
              <Text style={{ ...TYPOGRAPHY.label, color: COLORS.gray600, marginBottom: SPACING.sm }}>
                Listing Price
              </Text>
              <TextInput
                placeholder="e.g., $450,000"
                value={price}
                onChangeText={setPrice}
                style={inputStyle}
                placeholderTextColor={COLORS.gray400}
              />
            </View>
          </View>

          {/* Card 2: Location */}
          <View style={cardStyle}>
            <Text style={{ ...TYPOGRAPHY.h4, color: COLORS.navy, marginBottom: SPACING.lg }}>
              Location
            </Text>

            <View style={{ flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg }}>
              <View style={{ flex: 1 }}>
                <Text style={{ ...TYPOGRAPHY.label, color: COLORS.gray600, marginBottom: SPACING.sm }}>
                  State
                </Text>
                <Dropdown
                  label="Select state"
                  selectedValue={state}
                  onValueChange={v => {
                    setState(v);
                    setCity('');
                  }}
                  items={stateItems}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...TYPOGRAPHY.label, color: COLORS.gray600, marginBottom: SPACING.sm }}>
                  City
                </Text>
                <Dropdown
                  label="Select city"
                  selectedValue={city}
                  onValueChange={setCity}
                  items={cityItems}
                />
              </View>
            </View>

            <View>
              <Text style={{ ...TYPOGRAPHY.label, color: COLORS.gray600, marginBottom: SPACING.sm }}>
                Neighborhood (Optional)
              </Text>
              <TextInput
                placeholder="e.g., Downtown District"
                value={neighborhood}
                onChangeText={setNeighborhood}
                style={inputStyle}
                placeholderTextColor={COLORS.gray400}
              />
            </View>
          </View>

          {/* Card 3: Property Features */}
          <View style={cardStyle}>
            <Text style={{ ...TYPOGRAPHY.h4, color: COLORS.navy, marginBottom: SPACING.lg }}>
              Physical Features
            </Text>

            <View style={{ flexDirection: 'row', gap: SPACING.md, marginBottom: SPACING.lg }}>
              <View style={{ flex: 1 }}>
                <Text style={{ ...TYPOGRAPHY.label, color: COLORS.gray600, marginBottom: SPACING.sm }}>
                  Bedrooms
                </Text>
                <TextInput
                  placeholder="0"
                  value={bedrooms}
                  onChangeText={setBedrooms}
                  keyboardType="numeric"
                  style={inputStyle}
                  placeholderTextColor={COLORS.gray400}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ ...TYPOGRAPHY.label, color: COLORS.gray600, marginBottom: SPACING.sm }}>
                  Bathrooms
                </Text>
                <TextInput
                  placeholder="0.0"
                  value={bathrooms}
                  onChangeText={setBathrooms}
                  keyboardType="decimal-pad"
                  style={inputStyle}
                  placeholderTextColor={COLORS.gray400}
                />
              </View>
            </View>

            <View style={{ marginBottom: SPACING.lg }}>
              <Text style={{ ...TYPOGRAPHY.label, color: COLORS.gray600, marginBottom: SPACING.sm }}>
                Square Footage
              </Text>
              <TextInput
                placeholder="e.g., 2500"
                value={sqft}
                onChangeText={setSqft}
                keyboardType="numeric"
                style={inputStyle}
                placeholderTextColor={COLORS.gray400}
              />
            </View>

            <View style={{ marginBottom: SPACING.lg }}>
              <Text style={{ ...TYPOGRAPHY.label, color: COLORS.gray600, marginBottom: SPACING.sm }}>
                Lot Size
              </Text>
              <TextInput
                placeholder="e.g., 0.25 acres"
                value={lotSize}
                onChangeText={setLotSize}
                style={inputStyle}
                placeholderTextColor={COLORS.gray400}
              />
            </View>

            <View>
              <Text style={{ ...TYPOGRAPHY.label, color: COLORS.gray600, marginBottom: SPACING.sm }}>
                Year Built
              </Text>
              <TextInput
                placeholder="e.g., 2005"
                value={yearBuilt}
                onChangeText={setYearBuilt}
                keyboardType="numeric"
                style={inputStyle}
                placeholderTextColor={COLORS.gray400}
              />
            </View>
          </View>

          {/* Card 4: Target Buyer & Features */}
          <View style={cardStyle}>
            <Text style={{ ...TYPOGRAPHY.h4, color: COLORS.navy, marginBottom: SPACING.lg }}>
              Target Buyer & Highlights
            </Text>

            <View style={{ marginBottom: SPACING.lg }}>
              <Text style={{ ...TYPOGRAPHY.label, color: COLORS.gray600, marginBottom: SPACING.sm }}>
                Target Buyer
              </Text>
              <Dropdown
                label="Select buyer type"
                selectedValue={targetBuyer}
                onValueChange={setTargetBuyer}
                items={targetBuyerItems}
              />
            </View>

            <View>
              <Text style={{ ...TYPOGRAPHY.label, color: COLORS.gray600, marginBottom: SPACING.sm }}>
                Key Features
              </Text>
              <TextInput
                placeholder="Updated kitchen, hardwood floors, modern appliances..."
                value={highlights}
                onChangeText={setHighlights}
                multiline
                numberOfLines={5}
                style={{ ...inputStyle, textAlignVertical: 'top', minHeight: 120 }}
                placeholderTextColor={COLORS.gray400}
              />
            </View>
          </View>

          {/* Navigation */}
          <View style={{ flexDirection: 'row', gap: SPACING.md }}>
            <TouchableOpacity
              onPress={() => setCurrentStep(2)}
              style={{
                flex: 1,
                backgroundColor: COLORS.orange,
                paddingVertical: SPACING.lg,
                borderRadius: RADIUS.lg,
                alignItems: 'center',
                ...SHADOWS.md,
              }}
            >
              <Text style={{ ...TYPOGRAPHY.body, color: COLORS.white, fontWeight: '700' }}>
                Next: Generate
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={() => setCurrentStep(0)}
            style={{ alignItems: 'center', paddingVertical: SPACING.lg }}
          >
            <Text style={{ ...TYPOGRAPHY.body, color: COLORS.orange, fontWeight: '600' }}>
              Back
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ===== STEP 2: STYLE & GENERATE =====
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.gray50 }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + SPACING.lg,
          paddingBottom: insets.bottom + SPACING.lg,
          paddingHorizontal: SPACING.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xl }}>
          <TouchableOpacity onPress={() => setCurrentStep(1)} style={{ marginRight: SPACING.md }}>
            <Ionicons name="chevron-back" size={28} color={COLORS.navy} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ ...TYPOGRAPHY.h3, color: COLORS.navy }}>Customize & Generate</Text>
            <Text style={{ ...TYPOGRAPHY.bodySm, color: COLORS.gray600, marginTop: SPACING.xs }}>
              Step 3 of 3
            </Text>
          </View>
        </View>

        {/* Usage Bar */}
        <View style={{ marginBottom: SPACING.xl }}>
          <UsageBar usageCount={usageCount} isPro={isPro} hasPromo={hasPromo} />
        </View>

        {/* Card: Writing Tone */}
        <View style={cardStyle}>
          <Text style={{ ...TYPOGRAPHY.h4, color: COLORS.navy, marginBottom: SPACING.lg }}>
            Writing Tone
          </Text>
          <Text style={{ ...TYPOGRAPHY.bodySm, color: COLORS.gray600, marginBottom: SPACING.lg }}>
            Choose the style that best matches your listing strategy.
          </Text>
          <ToneChips tones={WRITING_TONES} selectedTone={selectedTone} onToneSelect={setSelectedTone} />
        </View>

        {/* Card: MLS Platform */}
        <View style={cardStyle}>
          <Text style={{ ...TYPOGRAPHY.h4, color: COLORS.navy, marginBottom: SPACING.lg }}>
            MLS Platform
          </Text>
          <Text style={{ ...TYPOGRAPHY.bodySm, color: COLORS.gray600, marginBottom: SPACING.lg }}>
            Select your MLS to optimize character limits automatically.
          </Text>
          <Dropdown
            label="Select MLS or no limit"
            selectedValue={mlsLimit}
            onValueChange={setMlsLimit}
            items={mlsItems}
            placeholder="No character limit"
          />
        </View>

        {/* Generate Button */}
        <TouchableOpacity
          onPress={handleGenerate}
          disabled={generating || photos.length === 0}
          style={{
            backgroundColor: generating || photos.length === 0 ? COLORS.gray300 : COLORS.orange,
            paddingVertical: SPACING.xl,
            borderRadius: RADIUS.lg,
            alignItems: 'center',
            marginBottom: SPACING.xl,
            opacity: generating || photos.length === 0 ? 0.6 : 1,
            ...SHADOWS.md,
          }}
        >
          {generating ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <>
              <Text style={{ ...TYPOGRAPHY.h4, color: COLORS.white, fontWeight: '700', marginBottom: SPACING.xs }}>
                Generate Listing
              </Text>
              <Text style={{ ...TYPOGRAPHY.bodySm, color: COLORS.white, opacity: 0.9 }}>
                Creates Full, MLS & Social versions
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Navigation */}
        <TouchableOpacity
          onPress={() => setCurrentStep(1)}
          style={{ alignItems: 'center', paddingVertical: SPACING.lg }}
        >
          <Text style={{ ...TYPOGRAPHY.body, color: COLORS.orange, fontWeight: '600' }}>
            Back
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <PromoModal visible={showPromoModal} onDismiss={() => setShowPromoModal(false)} onApply={handlePromoSubmit} loading={promoLoading} />
    </View>
  );
}
