"use client";

import H1Title from "@/app/components/H1Title";
import PageTransition from "@/app/components/animations/PageTransition";
import type {
	SalonClientDetail,
	SalonProductOption,
	SalonServiceTemplateSummary,
} from "@/lib/contracts/salon";
import SalonClientOverviewPanels from "./SalonClientOverviewPanels";
import SalonServiceFormPanel from "./SalonServiceFormPanel";
import SalonServiceHistoryPanel from "./SalonServiceHistoryPanel";
import SalonTemplateLibraryPanel from "./SalonTemplateLibraryPanel";
import { useSalonClientDetailView } from "./useSalonClientDetailView";

type Props = {
	initialDetail: SalonClientDetail;
	initialTemplates: SalonServiceTemplateSummary[];
	productOptions: SalonProductOption[];
	showOverviewPanels?: boolean;
	showServiceForm?: boolean;
	showHistory?: boolean;
	showTemplateLibrary?: boolean;
	historyHref?: string;
	title?: string;
	subtitle?: string;
};

export default function SalonClientDetailView({
	initialDetail,
	initialTemplates,
	productOptions,
	showOverviewPanels = true,
	showServiceForm = true,
	showHistory = true,
	showTemplateLibrary = false,
	historyHref,
	title,
	subtitle,
}: Props) {
	const {
		detail,
		templates,
		name,
		setName,
		phone,
		setPhone,
		email,
		setEmail,
		notes,
		setNotes,
		serviceDate,
		setServiceDate,
		serviceType,
		setServiceType,
		serviceNotes,
		setServiceNotes,
		serviceResult,
		setServiceResult,
		technicalDescription,
		setTechnicalDescription,
		formula,
		setFormula,
		technicalNotes,
		setTechnicalNotes,
		productUsages,
		resultImages,
		editingServiceId,
		deletingServiceId,
		technicalEmailDraftServiceId,
		technicalEmailDraft,
		technicalEmailSubject,
		setTechnicalEmailSubject,
		technicalEmailBody,
		setTechnicalEmailBody,
		isLoadingTechnicalEmail,
		technicalEmailFeedback,
		technicalEmailMailtoHref,
		handleOpenTechnicalEmailDraft,
		handleCopyTechnicalEmailDraft,
		resetTechnicalEmailDraft,
		historySearch,
		setHistorySearch,
		historyServiceType,
		setHistoryServiceType,
		historyDateFrom,
		setHistoryDateFrom,
		historyDateTo,
		setHistoryDateTo,
		isSavingProfile,
		isSavingService,
		templateName,
		setTemplateName,
		selectedTemplateId,
		isTemplateSaveOpen,
		setIsTemplateSaveOpen,
		isSavingTemplate,
		deletingTemplateId,
		profileFeedback,
		serviceFeedback,
		templateFeedback,
		isUploadingResultImages,
		resetServiceForm,
		updateProductUsage,
		addProductUsageRow,
		removeProductUsageRow,
		handleResultImagesUpload,
		handleRemoveResultImage,
		startServiceEditing,
		handleApplyTemplate,
		handleTemplateSelection,
		handleSaveCurrentFormAsTemplate,
		handleDeleteTemplate,
		serviceTypeOptions,
		filteredServices,
		handleProfileSubmit,
		handleServiceSubmit,
		handleDeleteService,
		historyCounterLabel,
		selectedTemplate,
	} = useSalonClientDetailView({
		initialDetail,
		initialTemplates,
		productOptions,
	});
	const contentGridClassName = showOverviewPanels
		? "grid gap-6 xl:grid-cols-[minmax(0,360px)_minmax(0,1fr)]"
		: "space-y-6";

	return (
		<PageTransition>
			<H1Title
				title={title ?? detail.salonClient.name}
				subtitle={
					subtitle ??
					"Consulta la ficha técnica, el historial y las sugerencias del salón"
				}
			/>

			<div className="mb-4 flex justify-end">
				<span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-white">
					{detail.salonClient.service_count} servicios
				</span>
			</div>

			<div className={contentGridClassName}>
				{showOverviewPanels ? (
					<SalonClientOverviewPanels
						detail={detail}
						name={name}
						phone={phone}
						email={email}
						notes={notes}
						isSavingProfile={isSavingProfile}
						profileFeedback={profileFeedback}
						onNameChange={setName}
						onPhoneChange={setPhone}
						onEmailChange={setEmail}
						onNotesChange={setNotes}
						onProfileSubmit={handleProfileSubmit}
					/>
				) : null}

				<div className="space-y-6">
					{showTemplateLibrary ? (
						<SalonTemplateLibraryPanel
							templates={templates}
							templateName={templateName}
							isSavingTemplate={isSavingTemplate}
							isSavingService={isSavingService}
							deletingTemplateId={deletingTemplateId}
							templateFeedback={templateFeedback}
							onTemplateNameChange={setTemplateName}
							onSaveCurrentFormAsTemplate={handleSaveCurrentFormAsTemplate}
							onApplyTemplate={handleApplyTemplate}
							onDeleteTemplate={handleDeleteTemplate}
						/>
					) : null}

					{showServiceForm ? (
						<SalonServiceFormPanel
							historyHref={historyHref}
							editingServiceId={editingServiceId}
							isSavingService={isSavingService}
							isUploadingResultImages={isUploadingResultImages}
							resetServiceForm={resetServiceForm}
							handleServiceSubmit={handleServiceSubmit}
							templates={templates}
							selectedTemplateId={selectedTemplateId}
							selectedTemplate={selectedTemplate}
							handleTemplateSelection={handleTemplateSelection}
							isSavingTemplate={isSavingTemplate}
							deletingTemplateId={deletingTemplateId}
							handleDeleteTemplate={handleDeleteTemplate}
							serviceDate={serviceDate}
							setServiceDate={setServiceDate}
							serviceType={serviceType}
							setServiceType={setServiceType}
							serviceResult={serviceResult}
							setServiceResult={setServiceResult}
							resultImages={resultImages}
							handleResultImagesUpload={handleResultImagesUpload}
							handleRemoveResultImage={handleRemoveResultImage}
							serviceNotes={serviceNotes}
							setServiceNotes={setServiceNotes}
							technicalDescription={technicalDescription}
							setTechnicalDescription={setTechnicalDescription}
							formula={formula}
							setFormula={setFormula}
							technicalNotes={technicalNotes}
							setTechnicalNotes={setTechnicalNotes}
							productUsages={productUsages}
							addProductUsageRow={addProductUsageRow}
							removeProductUsageRow={removeProductUsageRow}
							updateProductUsage={updateProductUsage}
							productOptions={productOptions}
							serviceFeedback={serviceFeedback}
							templateName={templateName}
							setTemplateName={setTemplateName}
							isTemplateSaveOpen={isTemplateSaveOpen}
							setIsTemplateSaveOpen={setIsTemplateSaveOpen}
							handleSaveCurrentFormAsTemplate={handleSaveCurrentFormAsTemplate}
							templateFeedback={templateFeedback}
						/>
					) : null}

					{showHistory ? (
						<SalonServiceHistoryPanel
							historyCounterLabel={historyCounterLabel}
							historySearch={historySearch}
							setHistorySearch={setHistorySearch}
							historyServiceType={historyServiceType}
							setHistoryServiceType={setHistoryServiceType}
							historyDateFrom={historyDateFrom}
							setHistoryDateFrom={setHistoryDateFrom}
							historyDateTo={historyDateTo}
							setHistoryDateTo={setHistoryDateTo}
							serviceTypeOptions={serviceTypeOptions}
							filteredServices={filteredServices}
							totalServiceCount={detail.services.length}
							editingServiceId={editingServiceId}
							deletingServiceId={deletingServiceId}
							isSavingService={isSavingService}
							handleOpenTechnicalEmailDraft={handleOpenTechnicalEmailDraft}
							startServiceEditing={startServiceEditing}
							handleDeleteService={handleDeleteService}
							technicalEmailDraftServiceId={technicalEmailDraftServiceId}
							isLoadingTechnicalEmail={isLoadingTechnicalEmail}
							resetTechnicalEmailDraft={resetTechnicalEmailDraft}
							technicalEmailDraft={technicalEmailDraft}
							technicalEmailSubject={technicalEmailSubject}
							setTechnicalEmailSubject={setTechnicalEmailSubject}
							technicalEmailBody={technicalEmailBody}
							setTechnicalEmailBody={setTechnicalEmailBody}
							technicalEmailMailtoHref={technicalEmailMailtoHref}
							handleCopyTechnicalEmailDraft={handleCopyTechnicalEmailDraft}
							technicalEmailFeedback={technicalEmailFeedback}
						/>
					) : null}
				</div>
			</div>
		</PageTransition>
	);
}
