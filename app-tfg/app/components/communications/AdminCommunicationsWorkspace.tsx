"use client";

import FeedbackMessage from "@/app/components/ui/FeedbackMessage";
import type {
	ClientOptionView,
	ClientSegmentAssignmentView,
	ProductLineOptionView,
	ProductOptionView,
	PromotionView,
	PromotionDiscountTypeView,
	SegmentView,
	TrainingEventView,
} from "./communication-view-types";
import {
	AdminAssignmentForm,
	AdminPromotionForm,
	AdminSegmentForm,
	AdminTrainingForm,
} from "./AdminCommunicationForms";
import {
	AdminAssignmentsList,
	AdminPromotionsList,
	AdminSegmentsList,
	AdminTrainingsList,
} from "./AdminCommunicationLists";
import AdminCommunicationsOverview from "./AdminCommunicationsOverview";
import { useAdminCommunicationsWorkspace } from "./useAdminCommunicationsWorkspace";

type Props = {
	segments: SegmentView[];
	assignments: ClientSegmentAssignmentView[];
	clients: ClientOptionView[];
	products: ProductOptionView[];
	productLines: ProductLineOptionView[];
	promotionDiscountTypes: PromotionDiscountTypeView[];
	promotions: PromotionView[];
	trainings: TrainingEventView[];
};

export default function AdminCommunicationsWorkspace({
	segments: initialSegments,
	assignments: initialAssignments,
	clients,
	products,
	productLines,
	promotionDiscountTypes,
	promotions: initialPromotions,
	trainings: initialTrainings,
}: Props) {
	const {
		activeTab,
		setActiveTab,
		openForm,
		segments,
		assignments,
		promotions,
		trainings,
		promotionForm,
		setPromotionForm,
		promotionGiftProductQuery,
		setPromotionGiftProductQuery,
		promotionProductQuery,
		setPromotionProductQuery,
		trainingForm,
		setTrainingForm,
		segmentForm,
		setSegmentForm,
		assignmentForm,
		setAssignmentForm,
		editingPromotionId,
		editingTrainingId,
		editingSegmentId,
		message,
		error,
		pendingAction,
		confirmDeleteAction,
		expandedTrainingId,
		promotionSubmitPending,
		trainingSubmitPending,
		segmentSubmitPending,
		assignmentSubmitPending,
		activeSummary,
		closeCommunicationForm,
		openCommunicationForm,
		getFormDialogClass,
		handlePromotionAttachmentUpload,
		handleSubmitPromotion,
		patchPromotionStatus,
		deletePromotion,
		handleSubmitTraining,
		patchTrainingStatus,
		deleteTraining,
		handleSubmitSegment,
		deleteSegment,
		handleCreateAssignment,
		deleteAssignment,
		startEditingPromotion,
		startEditingTraining,
		startEditingSegment,
		toggleTrainingEnrollmentList,
	} = useAdminCommunicationsWorkspace({
		initialSegments,
		initialAssignments,
		products,
		promotionDiscountTypes,
		initialPromotions,
		initialTrainings,
	});

	return (
		<div className="space-y-6">
			{openForm ? (
				<button
					type="button"
					aria-label="Cerrar formulario"
					onClick={closeCommunicationForm}
					className="app-modal-overlay z-[80]"
				/>
			) : null}

			<AdminCommunicationsOverview
				activeTab={activeTab}
				activeSummary={activeSummary}
				onTabChange={setActiveTab}
				onOpenForm={openCommunicationForm}
			/>

			{message ? (
				<FeedbackMessage type="success" message={message} />
			) : null}

			{error ? (
				<FeedbackMessage type="error" message={error} />
			) : null}

			{activeTab === "promotions" ? (
				<section className="grid gap-5">
					<AdminPromotionForm
						form={promotionForm}
						setForm={setPromotionForm}
						className={getFormDialogClass("promotions")}
						isOpen={openForm === "promotions"}
						isEditing={Boolean(editingPromotionId)}
						isSubmitPending={promotionSubmitPending}
						pendingAction={pendingAction}
						clients={clients}
						products={products}
						productLines={productLines}
						promotionDiscountTypes={promotionDiscountTypes}
						segments={segments}
						giftProductQuery={promotionGiftProductQuery}
						productQuery={promotionProductQuery}
						onGiftProductQueryChange={setPromotionGiftProductQuery}
						onProductQueryChange={setPromotionProductQuery}
						onAttachmentUpload={handlePromotionAttachmentUpload}
						onClose={closeCommunicationForm}
						onSubmit={handleSubmitPromotion}
					/>

					<AdminPromotionsList
						promotions={promotions}
						pendingAction={pendingAction}
						confirmDeleteAction={confirmDeleteAction}
						onStatusChange={patchPromotionStatus}
						onEdit={startEditingPromotion}
						onDelete={deletePromotion}
					/>
				</section>
			) : null}

			{activeTab === "trainings" ? (
				<section className="grid gap-5">
					<AdminTrainingForm
						form={trainingForm}
						setForm={setTrainingForm}
						className={getFormDialogClass("trainings")}
						isOpen={openForm === "trainings"}
						isEditing={Boolean(editingTrainingId)}
						isSubmitPending={trainingSubmitPending}
						onClose={closeCommunicationForm}
						onSubmit={handleSubmitTraining}
					/>

					<AdminTrainingsList
						trainings={trainings}
						pendingAction={pendingAction}
						confirmDeleteAction={confirmDeleteAction}
						expandedTrainingId={expandedTrainingId}
						onToggleEnrollmentList={toggleTrainingEnrollmentList}
						onStatusChange={patchTrainingStatus}
						onEdit={startEditingTraining}
						onDelete={deleteTraining}
					/>
				</section>
			) : null}

			{activeTab === "segments" ? (
				<section className="grid gap-5">
					<AdminSegmentForm
						form={segmentForm}
						setForm={setSegmentForm}
						className={getFormDialogClass("segments")}
						isOpen={openForm === "segments"}
						isEditing={Boolean(editingSegmentId)}
						isSubmitPending={segmentSubmitPending}
						onClose={closeCommunicationForm}
						onSubmit={handleSubmitSegment}
					/>

					<AdminSegmentsList
						segments={segments}
						pendingAction={pendingAction}
						confirmDeleteAction={confirmDeleteAction}
						onEdit={startEditingSegment}
						onDelete={deleteSegment}
					/>
				</section>
			) : null}

			{activeTab === "assignments" ? (
				<section className="grid gap-5">
					<AdminAssignmentForm
						form={assignmentForm}
						setForm={setAssignmentForm}
						className={getFormDialogClass("assignments")}
						isOpen={openForm === "assignments"}
						isSubmitPending={assignmentSubmitPending}
						clients={clients}
						segments={segments}
						onClose={closeCommunicationForm}
						onSubmit={handleCreateAssignment}
					/>

					<AdminAssignmentsList
						assignments={assignments}
						pendingAction={pendingAction}
						confirmDeleteAction={confirmDeleteAction}
						onDelete={deleteAssignment}
					/>
				</section>
			) : null}
		</div>
	);
}
