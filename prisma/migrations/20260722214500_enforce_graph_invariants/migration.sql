ALTER TABLE "GraphAssertion"
  ADD CONSTRAINT "GraphAssertion_exactly_one_object_check"
  CHECK ((("objectEntityId" IS NOT NULL)::integer + ("objectValue" IS NOT NULL)::integer) = 1);

ALTER TABLE "GraphEvidenceLink"
  ADD CONSTRAINT "GraphEvidenceLink_exactly_one_target_check"
  CHECK ((("assertionId" IS NOT NULL)::integer + ("relationshipId" IS NOT NULL)::integer) = 1);

ALTER TABLE "GraphEntity"
  ADD CONSTRAINT "GraphEntity_confidence_range_check"
  CHECK ("confidence" >= 0 AND "confidence" <= 1);

ALTER TABLE "GraphAlias"
  ADD CONSTRAINT "GraphAlias_confidence_range_check"
  CHECK ("confidence" >= 0 AND "confidence" <= 1);

ALTER TABLE "GraphAssertion"
  ADD CONSTRAINT "GraphAssertion_confidence_range_check"
  CHECK ("confidence" >= 0 AND "confidence" <= 1);

ALTER TABLE "GraphRelationship"
  ADD CONSTRAINT "GraphRelationship_confidence_range_check"
  CHECK ("confidence" >= 0 AND "confidence" <= 1);

ALTER TABLE "GraphEvidenceLink"
  ADD CONSTRAINT "GraphEvidenceLink_weight_range_check"
  CHECK ("weight" >= 0 AND "weight" <= 1);
